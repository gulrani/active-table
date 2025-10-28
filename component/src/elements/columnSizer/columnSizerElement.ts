import { UpdateRowElement } from "../../utils/insertRemoveStructure/update/updateRowElement";
import { ColumnSizerFillerElement } from "./columnSizerFillerElement";
import { SEMI_TRANSPARENT_COLOR } from "../../consts/colors";
import { ColumnSizerT } from "../../types/columnSizer";
import { PX } from "../../types/dimensions";

export interface BorderWidths {
  leftCellRight: number;
  rightCellLeft: number;
  leftCellLeft: number;
  // The last cell cannot determine if the left cell has a border-right (it's overridden),
  // so we check the cell before the left one to infer this.
  beforeLeftCellRight: number | undefined;
}

/**
 * Handles creation, styling, and visibility of column sizer elements.
 * Each column has its own sizer element for accurate hover and resize detection.
 */
export class ColumnSizerElement {
  // ===== CONSTANTS =====
  public static readonly FILLED_BACKGROUND_IMAGE =
    "linear-gradient(180deg, #cdcdcd, #cdcdcd 75%, transparent 75%, transparent 100%)";
  public static readonly EMPTY_BACKGROUND_IMAGE = "none";
  public static readonly DEFAULT_HOVER_COLOR = "grey";
  private static readonly CLASS_NAME = "column-sizer";
  private static readonly ID_PREFIX = `${ColumnSizerElement.CLASS_NAME}-`;
  public static readonly TRANSITION_TIME_MS = 200;
  private static readonly TRANSITION_TIME = `${ColumnSizerElement.TRANSITION_TIME_MS / 1000}s`;
  public static readonly HALF_TRANSITION_TIME_MS = ColumnSizerElement.TRANSITION_TIME_MS / 2;

  // ===== UTILITIES =====

  /** Returns true if the sizer is currently hovered */
  public static isHovered(sizer: HTMLElement): boolean {
    return sizer.style.backgroundImage === ColumnSizerElement.EMPTY_BACKGROUND_IMAGE;
  }

  public static setBackgroundImage(sizer: HTMLElement, image: string): void {
    sizer.style.backgroundImage = image;
  }

  public static unsetBackgroundImage(sizer: HTMLElement): void {
    sizer.style.backgroundImage = ColumnSizerElement.EMPTY_BACKGROUND_IMAGE;
  }

  public static setBackgroundColor(sizer: HTMLElement, color: string): void {
    sizer.style.backgroundColor = color;
  }

  public static setTransitionTime(sizer: HTMLElement): void {
    sizer.style.transition = ColumnSizerElement.TRANSITION_TIME;
  }

  public static unsetTransitionTime(sizer: HTMLElement): void {
    sizer.style.transition = "0.0s";
  }

  // ===== VISUAL STATE MANAGEMENT =====

  /**
   * Reset background color and width to default.
   * Does not reset background image.
   */
  public static unsetElementsToDefault(
    sizer: HTMLElement,
    width: PX,
    setColors = true
  ): void {
    if (setColors) {
      ColumnSizerElement.setBackgroundColor(sizer, SEMI_TRANSPARENT_COLOR);
    }
    ColumnSizerFillerElement.hide(sizer.children[0] as HTMLElement);
    sizer.style.width = width;
  }

  /** Sets static styles such as marginRight which depend on position */
  public static setStaticProperties(sizer: HTMLElement, marginRight: string): void {
    sizer.style.marginRight = marginRight;
  }

  /** Assigns a unique element ID based on sizer index */
  public static setElementId(sizer: HTMLElement, index: number): void {
    sizer.id = `${ColumnSizerElement.ID_PREFIX}${index}`;
  }

  // ===== CREATION =====

  /** Creates a new column sizer element */
  public static create(index: number, hoverColor?: string): HTMLElement {
    const sizer = document.createElement("div");
    ColumnSizerElement.setElementId(sizer, index);
    sizer.classList.add(ColumnSizerElement.CLASS_NAME);

    const filler = ColumnSizerFillerElement.create(hoverColor);
    sizer.append(filler);

    ColumnSizerElement.hide(sizer);
    return sizer;
  }

  // ===== DISPLAY CONTROL =====

  /** Shows the sizer and ensures header row height is correct */
  public static display(sizer: HTMLElement): void {
    const headerRow = sizer.parentElement?.parentElement as HTMLElement;
    UpdateRowElement.updateHeaderRowHeight(headerRow);
    sizer.style.display = "flex";
  }

  /** Hides the sizer immediately */
  private static hide(sizer: HTMLElement): void {
    sizer.style.display = "none";
  }

  /** Hides the sizer after half transition (for blur/fade animation) */
  private static hideWithBlurAnimation(sizer: HTMLElement): void {
    setTimeout(() => ColumnSizerElement.hide(sizer), ColumnSizerElement.HALF_TRANSITION_TIME_MS);
  }

  /**
   * Hides the sizer when its associated cell is not hovered anymore.
   * Keeps visible if another side cell is still hovered.
   */
  public static hideWhenCellNotHovered(columnSizer: ColumnSizerT, wasHovered: boolean): void {
    if (columnSizer.isSideCellHovered) return;
    if (wasHovered) {
      ColumnSizerElement.hideWithBlurAnimation(columnSizer.element);
    } else {
      ColumnSizerElement.hide(columnSizer.element);
    }
  }

  /**
   * Applies hover styles (color, width, transition, filler visibility)
   */
  public static setHoverStyle(
    columnSizer: ColumnSizerT,
    width: PX,
    withTransition: boolean,
    customColor?: string
  ): void {
    const { element, hoverColor } = columnSizer;
    ColumnSizerFillerElement.display(element.children[0] as HTMLElement);
    if (withTransition) ColumnSizerElement.setTransitionTime(element);
    ColumnSizerElement.setBackgroundColor(element, customColor || hoverColor);
    element.style.width = width;
  }
}
