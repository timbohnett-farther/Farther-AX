import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * GET /api/quality/transitions
 *
 * Returns data quality metrics for transition workbooks and records.
 *
 * Query parameters:
 * - workbook: Filter by specific sheet ID
 * - threshold: Show only records below quality threshold (0-100)
 * - critical_only: Show only records missing critical fields (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workbookFilter = searchParams.get('workbook');
    const thresholdStr = searchParams.get('threshold');
    const criticalOnlyStr = searchParams.get('critical_only');

    const threshold = thresholdStr ? parseFloat(thresholdStr) : null;
    const criticalOnly = criticalOnlyStr === 'true';

    // Build where clause
    const where: any = {};

    if (workbookFilter) {
      where.sheet_id = workbookFilter;
    }

    if (threshold !== null) {
      where.completeness_pct = {
        lt: threshold,
      };
    }

    if (criticalOnly) {
      where.critical_fields_ok = false;
    }

    // Fetch transition clients with quality metrics
    const clients = await prisma.transitionClient.findMany({
      where,
      select: {
        id: true,
        sheet_id: true,
        sheet_row_index: true,
        workbook_name: true,
        household_name: true,
        advisor_name: true,
        primary_email: true,
        completeness_pct: true,
        critical_fields_ok: true,
        quality_alerts: true,
        data_quality: true,
        synced_at: true,
      },
      orderBy: [
        { completeness_pct: 'asc' },
        { sheet_id: 'asc' },
        { sheet_row_index: 'asc' },
      ],
    });

    type ClientResult = typeof clients[number];

    // Fetch workbook quality summaries
    const workbooks = await prisma.transitionWorkbook.findMany({
      where: workbookFilter ? { sheet_id: workbookFilter } : undefined,
      select: {
        sheet_id: true,
        workbook_name: true,
        data_quality_score: true,
        critical_rows_ok: true,
        total_rows: true,
        import_metadata: true,
        last_import_errors: true,
        last_synced_at: true,
      },
      orderBy: {
        data_quality_score: 'asc',
      },
    });

    type WorkbookResult = typeof workbooks[number];

    // Calculate overall statistics
    const totalRecords = await prisma.transitionClient.count();
    const recordsWithCriticalFields = await prisma.transitionClient.count({
      where: { critical_fields_ok: true },
    });

    const avgQualityResult = await prisma.transitionClient.aggregate({
      _avg: {
        completeness_pct: true,
      },
    });

    // Count by completeness category
    const [excellent, good, fair, poor] = await Promise.all([
      prisma.transitionClient.count({ where: { completeness_pct: { gte: 90 } } }),
      prisma.transitionClient.count({ where: { completeness_pct: { gte: 70, lt: 90 } } }),
      prisma.transitionClient.count({ where: { completeness_pct: { gte: 50, lt: 70 } } }),
      prisma.transitionClient.count({ where: { completeness_pct: { lt: 50 } } }),
    ]);

    // Parse alerts from records
    const allAlerts: Array<{
      severity: 'critical' | 'warning' | 'info';
      field: string;
      message: string;
      workbook: string;
      household: string | null;
    }> = [];

    for (const client of clients.slice(0, 100)) { // Limit to first 100 for performance
      if (client.quality_alerts) {
        try {
          const alerts = JSON.parse(client.quality_alerts);
          if (Array.isArray(alerts)) {
            for (const alert of alerts) {
              allAlerts.push({
                severity: alert.severity,
                field: alert.field,
                message: alert.message,
                workbook: client.workbook_name || 'Unknown',
                household: client.household_name,
              });
            }
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    // Count alert frequencies
    const alertFrequency = new Map<string, { count: number; severity: string }>();
    for (const alert of allAlerts) {
      const key = `${alert.severity}:${alert.message}`;
      const existing = alertFrequency.get(key);
      if (existing) {
        existing.count++;
      } else {
        alertFrequency.set(key, { count: 1, severity: alert.severity });
      }
    }

    const topAlerts = Array.from(alertFrequency.entries())
      .map(([key, val]) => {
        const message = key.split(':').slice(1).join(':');
        return {
          severity: val.severity,
          message,
          count: val.count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      summary: {
        total_records: totalRecords,
        records_with_critical_fields: recordsWithCriticalFields,
        records_missing_critical_fields: totalRecords - recordsWithCriticalFields,
        avg_completeness_pct: Math.round((avgQualityResult._avg.completeness_pct || 0) * 10) / 10,
        completeness_breakdown: {
          excellent,
          good,
          fair,
          poor,
        },
      },
      workbooks: workbooks.map((wb: WorkbookResult) => ({
        sheet_id: wb.sheet_id,
        workbook_name: wb.workbook_name,
        data_quality_score: wb.data_quality_score,
        critical_rows_ok: wb.critical_rows_ok,
        total_rows: wb.total_rows,
        critical_pct: wb.total_rows > 0
          ? Math.round((wb.critical_rows_ok / wb.total_rows) * 100)
          : 0,
        last_import_errors: wb.last_import_errors ? JSON.parse(wb.last_import_errors) : [],
        last_synced_at: wb.last_synced_at.toISOString(),
      })),
      top_alerts: topAlerts,
      records: clients.map((client: ClientResult) => ({
        id: client.id,
        sheet_id: client.sheet_id,
        sheet_row_index: client.sheet_row_index,
        workbook_name: client.workbook_name,
        household_name: client.household_name,
        advisor_name: client.advisor_name,
        primary_email: client.primary_email,
        completeness_pct: client.completeness_pct,
        critical_fields_ok: client.critical_fields_ok,
        alerts: client.quality_alerts ? JSON.parse(client.quality_alerts) : [],
        synced_at: client.synced_at.toISOString(),
      })),
      filters_applied: {
        workbook: workbookFilter,
        threshold,
        critical_only: criticalOnly,
      },
    });
  } catch (error) {
    console.error('[Quality API] Failed to fetch quality metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch quality metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
