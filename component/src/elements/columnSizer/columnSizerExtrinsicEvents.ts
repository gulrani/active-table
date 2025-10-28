import { UpdateRowElement } from "../../utils/insertRemoveStructure/update/updateRowElement";
import { ColumnSizerT, SelectedColumnSizerT } from "../../types/columnSizer";
import { ColumnSizerGenericUtils } from "./utils/columnSizerGenericUtils";
import { MovableColumnSizerElement } from "./movableColumnSizerElement";
import { ColumnSizerSetWidth } from "./utils/columnSizerSetWidth";
import { TableDimensions } from "../../types/tableDimensions";
import { SEMI_TRANSPARENT_COLOR } from "../../consts/colors";
import { ColumnsDetailsT } from "../../types/columnDetails";
import { ColumnSizerElement } from "./columnSizerElement";
import { ActiveTable } from "../../activeTable";

export class ColumnSizerExtrinsicEvents {
  private static moveMovableElement(selectedColumnSizer: HTMLElement, columnsDetails: ColumnsDetailsT, newLeft: number) {
    const { columnSizer } = ColumnSizerGenericUtils.getSizerDetailsViaElementId(selectedColumnSizer.id, columnsDetails);
    columnSizer.movableElement.style.left = `${newLeft}px`;
  }

  // prettier-ignore
  public static windowMouseMove(at: ActiveTable, newXMovement: number) {
    const { _activeOverlayElements: { selectedColumnSizer }, _columnsDetails } = at;
    if (selectedColumnSizer) {
      const { moveLimits, element } = selectedColumnSizer;
      const tableElement = at._tableElementRef as HTMLElement;
      const isRTL = getComputedStyle(tableElement).direction === "rtl";

      // reverse direction for RTL tables
      selectedColumnSizer.mouseMoveOffset += isRTL ? -newXMovement : newXMovement;

      // apply movement only within allowed limits
      if (
        selectedColumnSizer.mouseMoveOffset >= moveLimits.left &&
        selectedColumnSizer.mouseMoveOffset <= moveLimits.right
      ) {
        ColumnSizerExtrinsicEvents.moveMovableElement(
          element,
          _columnsDetails,
          selectedColumnSizer.mouseMoveOffset
        );
      }
    }
  }

  // prettier-ignore
  private static setWidth(
    selectedColumnSizer: SelectedColumnSizerT,
    tableElement: HTMLElement,
    tableDimensions: TableDimensions,
    leftHeader: HTMLElement,
    rightHeader?: HTMLElement
  ) {
    ColumnSizerElement.unsetTransitionTime(selectedColumnSizer.element);
    ColumnSizerSetWidth.set(selectedColumnSizer, tableElement, tableDimensions, leftHeader, rightHeader);
  }

  // prettier-ignore
  private static mouseUp(at: ActiveTable) {
    const { _activeOverlayElements: activeOverlayElements, _columnsDetails, _tableDimensions, _tableElementRef } = at;
    const selectedColumnSizer = activeOverlayElements.selectedColumnSizer as SelectedColumnSizerT;
    const { columnSizer, headerCell, sizerNumber } = ColumnSizerGenericUtils.getSizerDetailsViaElementId(
      selectedColumnSizer.element.id,
      _columnsDetails
    );

    ColumnSizerExtrinsicEvents.setWidth(
      selectedColumnSizer,
      _tableElementRef as HTMLElement,
      _tableDimensions,
      headerCell,
      ColumnSizerGenericUtils.findNextResizableColumnHeader(_columnsDetails, sizerNumber)
    );

    MovableColumnSizerElement.hide(columnSizer.movableElement);
    UpdateRowElement.updateHeaderRowHeight(columnSizer.element.parentElement?.parentElement as HTMLElement);
  }

  private static setSizerStyleToHoverNoAnimation(columnSizer: ColumnSizerT, anotherColor?: string) {
    const { width } = columnSizer.styles.hover;
    ColumnSizerElement.setHoverStyle(columnSizer, width, false, anotherColor);
    ColumnSizerElement.unsetBackgroundImage(columnSizer.element);
  }

  private static mouseUpNotOnSizer(columnSizer: ColumnSizerT) {
    const { element: sizerElement, styles: sizerStyles, movableElement } = columnSizer;
    ColumnSizerExtrinsicEvents.setSizerStyleToHoverNoAnimation(columnSizer, movableElement.style.backgroundColor);

    // start hover animation
    setTimeout(() => {
      ColumnSizerElement.setTransitionTime(sizerElement);
      ColumnSizerElement.unsetElementsToDefault(sizerElement, sizerStyles.default.width, false);
      ColumnSizerElement.hideWhenCellNotHovered(columnSizer, true);
    });

    // reset properties after animation
    setTimeout(() => {
      ColumnSizerElement.setBackgroundImage(sizerElement, sizerStyles.default.backgroundImage);
      ColumnSizerElement.setBackgroundColor(sizerElement, SEMI_TRANSPARENT_COLOR);
    }, ColumnSizerElement.TRANSITION_TIME_ML);
  }

  // when mouse released anywhere on window
  // prettier-ignore
  public static windowMouseUp(at: ActiveTable) {
    const selected = at._activeOverlayElements.selectedColumnSizer as SelectedColumnSizerT;
    if (!selected) return;

    const { columnSizer } = ColumnSizerGenericUtils.getSizerDetailsViaElementId(
      selected.element.id,
      at._columnsDetails
    );

    ColumnSizerExtrinsicEvents.mouseUp(at);
    ColumnSizerExtrinsicEvents.mouseUpNotOnSizer(columnSizer);

    delete at._activeOverlayElements.selectedColumnSizer;
  }

  private static mouseUpOnSizer(columnSizer: ColumnSizerT) {
    ColumnSizerExtrinsicEvents.setSizerStyleToHoverNoAnimation(columnSizer);
    columnSizer.isMouseUpOnSizer = true;
    setTimeout(() => {
      columnSizer.isMouseUpOnSizer = false;
      ColumnSizerElement.setTransitionTime(columnSizer.element);
    });
  }

  // prettier-ignore
  public static tableMouseUp(at: ActiveTable, target: HTMLElement) {
    const selectedColumnSizer = at._activeOverlayElements.selectedColumnSizer as SelectedColumnSizerT;
    if (!selectedColumnSizer) return;

    const { columnSizer } = ColumnSizerGenericUtils.getSizerDetailsViaElementId(
      selectedColumnSizer.element.id,
      at._columnsDetails
    );

    ColumnSizerExtrinsicEvents.mouseUp(at);

    // handle case when sizer was released directly over the movable sizer element
    if (MovableColumnSizerElement.isMovableColumnSizer(target) && !selectedColumnSizer.wasAutoresized) {
      ColumnSizerExtrinsicEvents.mouseUpOnSizer(columnSizer);
    } else {
      ColumnSizerExtrinsicEvents.mouseUpNotOnSizer(columnSizer);
    }

    delete at._activeOverlayElements.selectedColumnSizer;
  }
}
