import { StaticTable } from "../../../utils/tableDimensions/staticTable/staticTable";
import { SizerMoveLimits, SelectedColumnSizerT } from "../../../types/columnSizer";
import { TableDimensions } from "../../../types/tableDimensions";

// Avoid using offsetWidth for cells as it rounds widths up, losing precision.
// Use Number.parseFloat instead to preserve decimal widths and prevent jitter.
export class ColumnSizerSetWidth {
  private static getWidthDelta(mouseMoveOffset: number, moveLimits: SizerMoveLimits) {
    if (mouseMoveOffset < moveLimits.left) return moveLimits.left;
    if (mouseMoveOffset > moveLimits.right) return moveLimits.right;
    return mouseMoveOffset;
  }

  private static getNewColumnWidth(selectedColumnSizer: SelectedColumnSizerT, columnElement: HTMLElement, isRTL: boolean) {
    const { moveLimits, mouseMoveOffset, initialOffset } = selectedColumnSizer;
    const delta = ColumnSizerSetWidth.getWidthDelta(mouseMoveOffset, moveLimits) - initialOffset;
    const baseWidth = Number.parseFloat(columnElement.style.width) || columnElement.offsetWidth;
    // reverse direction if RTL
    return Math.max(0, baseWidth + (isRTL ? -delta : delta));
  }

  private static setColumnWidth(selectedColumnSizer: SelectedColumnSizerT, headerCell: HTMLElement) {
    const isRTL = getComputedStyle(selectedColumnSizer.tableElement as HTMLElement).direction === "rtl";
    const newWidth = ColumnSizerSetWidth.getNewColumnWidth(selectedColumnSizer, headerCell, isRTL);
    headerCell.style.width = `${newWidth}px`;
  }

  // Fix column width mismatch when user crushes a column to minimum allowed
  private static correctWidths(selectedColumnSizer: SelectedColumnSizerT, crushedElement: HTMLElement, sideElement: HTMLElement, initialWidthsTotal: number) {
    if (crushedElement.offsetWidth !== Math.round(Number.parseFloat(crushedElement.style.width))) {
      const crushedWidth = crushedElement.offsetWidth;
      const sideWidth = initialWidthsTotal - crushedWidth;
      crushedElement.style.width = `${crushedWidth}px`;
      sideElement.style.width = `${sideWidth}px`;
      selectedColumnSizer.wasAutoresized = true;
      setTimeout(() => (selectedColumnSizer.wasAutoresized = false));
    }
  }

  // Set both sides' widths (handles RTL and LTR)
  private static setWidths(selectedColumnSizer: SelectedColumnSizerT, leftHeader: HTMLElement, rightHeader: HTMLElement, initialWidthsTotal: number) {
    const isRTL = getComputedStyle(selectedColumnSizer.tableElement as HTMLElement).direction === "rtl";

    if (isRTL) {
      // mirror logic for RTL
      const newRightWidth = ColumnSizerSetWidth.getNewColumnWidth(selectedColumnSizer, rightHeader, isRTL);
      const newLeftWidth = Math.max(0, initialWidthsTotal - newRightWidth);
      rightHeader.style.width = `${newRightWidth}px`;
      leftHeader.style.width = `${newLeftWidth}px`;
    } else {
      const newLeftWidth = ColumnSizerSetWidth.getNewColumnWidth(selectedColumnSizer, leftHeader, isRTL);
      const newRightWidth = Math.max(0, initialWidthsTotal - newLeftWidth);
      leftHeader.style.width = `${newLeftWidth}px`;
      rightHeader.style.width = `${newRightWidth}px`;
    }
  }

  // Handle dynamic width updates for both columns
  private static setColumnsWidths(selectedColumnSizer: SelectedColumnSizerT, leftHeader: HTMLElement, rightHeader: HTMLElement) {
    const leftWidth = Number.parseFloat(leftHeader.style.width) || leftHeader.offsetWidth;
    const rightWidth = Number.parseFloat(rightHeader.style.width) || rightHeader.offsetWidth;
    const initialWidthsTotal = leftWidth + rightWidth;

    ColumnSizerSetWidth.setWidths(selectedColumnSizer, leftHeader, rightHeader, initialWidthsTotal);

    if (rightWidth > leftWidth) {
      ColumnSizerSetWidth.correctWidths(selectedColumnSizer, leftHeader, rightHeader, initialWidthsTotal);
    } else {
      ColumnSizerSetWidth.correctWidths(selectedColumnSizer, rightHeader, leftHeader, initialWidthsTotal);
    }
  }

  // Main public entry
  public static set(selectedColumnSizer: SelectedColumnSizerT, tableElement: HTMLElement, tableDimensions: TableDimensions, leftHeader: HTMLElement, rightHeader?: HTMLElement) {
    if (rightHeader && StaticTable.isStaticTableWidth(tableElement, tableDimensions)) {
      // When table width is static, control both columns
      ColumnSizerSetWidth.setColumnsWidths(selectedColumnSizer, leftHeader, rightHeader);
    } else {
      // Otherwise, control a single column
      ColumnSizerSetWidth.setColumnWidth(selectedColumnSizer, leftHeader);
    }

    setTimeout(() => selectedColumnSizer.fireColumnsUpdate());
  }
}
