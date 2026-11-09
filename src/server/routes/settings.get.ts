import { defineEventHandler } from 'h3'
import { currentConfig } from '../../index'

/** Return the composed config so the card can render the current selection. */
export default defineEventHandler(() => ({ settings: currentConfig() }))
