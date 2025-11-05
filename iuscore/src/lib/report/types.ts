import type { classifyIbusActivity } from "../segments"

export type IbusClassificationResult = ReturnType<typeof classifyIbusActivity>

export interface IbusClassificationEntry {
  label: string
  classification: IbusClassificationResult
}
