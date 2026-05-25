import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AppShell from '../components/AppShell'
import FeedbackMessage from '../components/FeedbackMessage'
import { getApiErrorMessage } from '../api/client'
import { getPacientes } from '../api/pacientes'
import {
  getProntuarioPorPaciente,
  atualizarOdontogramaDente,
  atualizarDenticaoAtiva,
} from '../api/prontuario'
import { useAuth } from '../hooks/useAuth'
import dentePermanenteSvg from '../assets/odontograma/Dente_permanente.svg?raw'
import denteDeciduoSvg from '../assets/odontograma/denticao_decidua.svg?raw'
import denticaoMistaSvg from '../assets/odontograma/denticao_mista.svg?raw'

const TEETH_LAYERS = [
  {
    title: 'Dentição permanente',
    source: 'permanente',
    rows: [
      { title: 'Arcada superior direita', teeth: ['18', '17', '16', '15', '14', '13', '12', '11'] },
      { title: 'Arcada superior esquerda', teeth: ['21', '22', '23', '24', '25', '26', '27', '28'] },
      { title: 'Arcada inferior esquerda', teeth: ['31', '32', '33', '34', '35', '36', '37', '38'] },
      { title: 'Arcada inferior direita', teeth: ['48', '47', '46', '45', '44', '43', '42', '41'] },
    ],
  },
  {
    title: 'Dentição decídua',
    source: 'decidua',
    rows: [
      { title: 'Arcada superior direita', teeth: ['55', '54', '53', '52', '51'] },
      { title: 'Arcada superior esquerda', teeth: ['61', '62', '63', '64', '65'] },
      { title: 'Arcada inferior esquerda', teeth: ['85', '84', '83', '82', '81'] },
      { title: 'Arcada inferior direita', teeth: ['71', '72', '73', '74', '75'] },
    ],
  },
]

const STATUS_OPTIONS = [
  {
    value: 'ok',
    label: 'Saudavel',
    subtitle: 'Saudável',
    chipClass: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    apiSupported: true,
  },
  {
    value: 'trat',
    label: 'Tratado',
    subtitle: 'Tratamento registrado',
    chipClass: 'bg-cyan-50 border-cyan-200 text-cyan-800',
    apiSupported: true,
  },
  {
    value: 'carie',
    label: 'Cárie',
    subtitle: 'Cárie ativa / atenção',
    chipClass: 'bg-amber-50 border-amber-200 text-amber-800',
    apiSupported: true,
    suporteCariePercentual: true,
  },
  {
    value: 'ext',
    label: 'Extração indicada',
    subtitle: 'Extração indicada',
    chipClass: 'bg-rose-50 border-rose-200 text-rose-800',
    apiSupported: true,
  },
  {
    value: 'ausente',
    label: 'Ausente',
    subtitle: 'Dente ausente',
    chipClass: 'bg-stone-100 border-stone-200 text-stone-700',
    apiSupported: true,
  },
  {
    value: 'implante',
    label: 'Implante',
    subtitle: 'Implante',
    chipClass: 'bg-violet-50 border-violet-200 text-violet-800',
    apiSupported: true,
  },
  {
    value: 'protese',
    label: 'Prótese',
    subtitle: 'Reabilitação/estrutura protética',
    chipClass: 'bg-stone-100 border-stone-300 text-stone-700',
    apiSupported: true,
  },
]

const API_SUPPORTED_STATUS_VALUES = STATUS_OPTIONS.filter((status) => status.apiSupported).map((status) => status.value)
const supportedStatusByValue = Object.fromEntries(STATUS_OPTIONS.map((status) => [status.value, status]))
const DEFAULT_STATUS = API_SUPPORTED_STATUS_VALUES[0] || 'ok'
const ALL_TEETH = TEETH_LAYERS.flatMap((layer) => layer.rows.flatMap((row) => row.teeth))
const LEGEND_OPTIONS = STATUS_OPTIONS.filter((status) => status.apiSupported || status.value === 'protese')
const DENTES_POR_DENTICAO = {
  permanente: TEETH_LAYERS.find((layer) => layer.source === 'permanente')?.rows.flatMap((row) => row.teeth) || [],
  decidua: TEETH_LAYERS.find((layer) => layer.source === 'decidua')?.rows.flatMap((row) => row.teeth) || [],
  mista: [],
}
DENTES_POR_DENTICAO.mista = [
  ...DENTES_POR_DENTICAO.permanente,
  ...DENTES_POR_DENTICAO.decidua,
]
const DECIDUOUS_TO_PERMANENT_SLOT = {
  55: '15',
  54: '14',
  53: '13',
  52: '12',
  51: '11',
  61: '21',
  62: '22',
  63: '23',
  64: '24',
  65: '25',
  85: '45',
  84: '44',
  83: '43',
  82: '42',
  81: '41',
  71: '31',
  72: '32',
  73: '33',
  74: '34',
  75: '35',
}
const PERMANENT_SLOT_TO_DECIDUOUS = Object.fromEntries(
  Object.entries(DECIDUOUS_TO_PERMANENT_SLOT).map(([deciduo, permanente]) => [permanente, deciduo]),
)
const QUICK_PATIENT_SELECTION_LIMIT = 10
const TODAS_TEETH = [...DENTES_POR_DENTICAO.permanente, ...DENTES_POR_DENTICAO.decidua]
const DENTICAO_OPTIONS = [
  {
    value: 'Permanente',
    label: 'Permanente',
  },
  {
    value: 'Decidua',
    label: 'Decídua',
  },
  {
    value: 'Mista',
    label: 'Mista',
  },
]
const SVG_CANVAS_SIZES = {
  permanente: {
    wrapperClass: 'w-full max-w-[min(100%,1440px)]',
    svgHeightClass: 'h-[clamp(220px,32vw,360px)]',
  },
  decidua: {
    wrapperClass: 'w-full max-w-[min(100%,1440px)]',
    svgHeightClass: 'h-[clamp(220px,32vw,360px)]',
  },
}
const MINI_PANEL_DEFAULT_ANCHOR = { x: 16, y: 16 }
const SVG_NUMBER_PATTERN = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi
const SVG_PATH_DATA_PATTERN = /\sd="([^"]+)"/gi
const SVG_TOOTH_GROUP_PATTERN = /<g\b[^>]*id="tooth-(\d{2})"[^>]*>[\s\S]*?<\/g>/gi
const SVG_SHAPE_SELECTOR = 'path, polygon, polyline, rect, circle, ellipse, line'

const ODO_GRAPHS_FOR_SVG_UPGRADE = [
  {
    source: 'permanente',
    title: 'Dentição permanente',
    label: 'Dente_permanente.svg',
    file: dentePermanenteSvg,
  },
  {
    source: 'decidua',
    title: 'Dentição decídua',
    label: 'denticao_decidua.svg',
    file: denteDeciduoSvg,
  },
]

const SVG_STATUS_STYLE_BY_VALUE = {
  ok: { fill: '#ecfdf5', stroke: '#059669' },
  trat: { fill: '#f0f9ff', stroke: '#0284c7' },
  carie: { fill: '#fffbeb', stroke: '#b45309' },
  ext: { fill: '#ffe4e6', stroke: '#e11d48' },
  ausente: { fill: '#f5f5f4', stroke: '#334155' },
  implante: { fill: '#ede9fe', stroke: '#6d28d9' },
  protese: { fill: '#f8fafc', stroke: '#334155' },
}

function getToothCodesFromSvgMarkup(svgMarkup) {
  const matches = svgMarkup.matchAll(/id="tooth-(\d{2})"/g)
  const values = new Set()

  for (const match of matches) {
    values.add(match[1])
  }

  return values
}

function parseMixedToothSymbolsWithDom(svgMarkup) {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined' || typeof document === 'undefined') {
    return {}
  }

  const parser = new DOMParser()
  const parsed = parser.parseFromString(svgMarkup, 'image/svg+xml')
  const parsedSvg = parsed.querySelector('svg')

  if (!parsedSvg) {
    return {}
  }

  const namespace = 'http://www.w3.org/2000/svg'
  const measurementSvg = document.createElementNS(namespace, 'svg')
  const serializer = new XMLSerializer()

  measurementSvg.style.position = 'absolute'
  measurementSvg.style.width = '0'
  measurementSvg.style.height = '0'
  measurementSvg.style.opacity = '0'
  measurementSvg.style.pointerEvents = 'none'
  measurementSvg.setAttribute('aria-hidden', 'true')

  try {
    document.body.appendChild(measurementSvg)

    const symbols = {}
    parsedSvg.querySelectorAll('[id^="tooth-"]').forEach((group) => {
      const toothCode = group.getAttribute('id')?.replace('tooth-', '')
      if (!/^\d{2}$/.test(toothCode || '')) {
        return
      }

      const groupClone = group.cloneNode(true)
      while (measurementSvg.firstChild) {
        measurementSvg.removeChild(measurementSvg.firstChild)
      }
      measurementSvg.appendChild(groupClone)

      let bbox
      try {
        bbox = groupClone.getBBox()
      } catch {
        // fallback abaixo via parse manual de path
      }

      if (!bbox || !Number.isFinite(bbox.width) || !Number.isFinite(bbox.height) || bbox.width <= 0 || bbox.height <= 0) {
        bbox = extractSvgPathBounds(group.outerHTML)
      }

      if (!bbox) {
        return
      }

      symbols[toothCode] = {
        markup: serializer.serializeToString(group.cloneNode(true)),
        viewBox: `${bbox.x} ${bbox.y} ${Math.max(1, bbox.width)} ${Math.max(1, bbox.height)}`,
      }
    })

    return symbols
  } finally {
    measurementSvg.remove()
  }
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.min(Math.max(value, min), max)
}

function resolvePopoverAnchor(anchorX, anchorY, popoverWidth, popoverHeight) {
  if (!Number.isFinite(popoverWidth) || !Number.isFinite(popoverHeight)) {
    return {
      left: `${clamp(anchorX, 16, window.innerWidth - 16)}px`,
      top: `${clamp(anchorY, 16, window.innerHeight - 16)}px`,
    }
  }

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  return {
    left: `${clamp(anchorX + 12, 16, Math.max(16, viewportWidth - popoverWidth - 16))}px`,
    top: `${clamp(anchorY + 12, 16, Math.max(16, viewportHeight - popoverHeight - 16))}px`,
  }
}

function buildPacienteResumoLinha(paciente) {
  const nome = (paciente?.nome || '').trim()
  const cpf = getSearchText(paciente?.cpf || paciente?.Cpf || '')
  const telefone = onlyDigits(paciente?.telefoneWhatsapp || paciente?.TelefoneWhatsapp || '')
  const email = (paciente?.email || paciente?.Email || '').trim()

  const detalhes = [cpf && `CPF: ${cpf}`, telefone && `Tel: ${telefone}`, email && email]
    .filter(Boolean)
    .join(' • ')

  if (!nome) {
    return detalhes || 'Paciente sem nome'
  }

  return detalhes ? `${nome} • ${detalhes}` : nome
}

function getMissingToothCodesFromSvgMarkup(svgMarkup, targetCodes) {
  const availableCodes = getToothCodesFromSvgMarkup(svgMarkup)

  return targetCodes.filter((code) => !availableCodes.has(code))
}

function validateToothSymbolExtraction(svgMarkup, expectedCodes, sourceLabel = 'svg') {
  const rawMatches = [...svgMarkup.matchAll(/id="tooth-(\d{2})"/g)]
  const counters = new Map()
  for (const match of rawMatches) {
    const current = counters.get(match[1]) || 0
    counters.set(match[1], current + 1)
  }

  const expectedSet = new Set(expectedCodes)
  const missingCodes = expectedCodes.filter((code) => !counters.has(code))
  const duplicatedCodes = [...counters.entries()]
    .filter(([, count]) => count > 1)
    .map(([code]) => code)

  return {
    sourceLabel,
    totalFound: counters.size,
    totalExpected: expectedSet.size,
    missingCodes,
    duplicatedCodes,
    isValid:
      duplicatedCodes.length === 0 && missingCodes.length === 0 && counters.size >= expectedSet.size,
  }
}

const ODO_GRAPHS_WITH_VALID_IDS = ODO_GRAPHS_FOR_SVG_UPGRADE.map((layer) => {
  const toothCodes = TEETH_LAYERS.find((candidate) => candidate.source === layer.source)?.rows.flatMap((row) => row.teeth) || []
  const targetSet = new Set(toothCodes)
  const file = layer.file
  const missingToothCodes = getMissingToothCodesFromSvgMarkup(file, toothCodes).filter((code) => targetSet.has(code))

  return {
    ...layer,
    file,
    toothCodes,
    missingToothCodes,
  }
})

const MIXED_TOOTH_VALIDATION = validateToothSymbolExtraction(denticaoMistaSvg, DENTES_POR_DENTICAO.mista, 'denticao_mista')
if (typeof window !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
  if (!MIXED_TOOTH_VALIDATION.isValid) {
    console.warn(
      '[Prontuario] denticao_mista.svg possui inconsistencias de ids:',
      `faltantes=${MIXED_TOOTH_VALIDATION.missingCodes.join(',') || 'nenhuma'}`,
      `duplicados=${MIXED_TOOTH_VALIDATION.duplicatedCodes.join(',') || 'nenhum'}`,
      `encontrados=${MIXED_TOOTH_VALIDATION.totalFound}`,
    )
  }
}

const HAS_STRUCTURED_SVG_IDS = true

function formatDateTime(value) {
  if (!value) {
    return 'Nao informado'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Data invalida'
  }

  return parsedDate.toLocaleString('pt-BR')
}

function normalizarDenticao(denticao) {
  const normalizada = String(denticao || 'Permanente').trim().toLowerCase()
  if (normalizada === 'decidua') {
    return 'Decidua'
  }

  if (normalizada === 'mista') {
    return 'Mista'
  }

  return 'Permanente'
}

function normalizeToothMap(rawValue) {
  const current = {}
  TODAS_TEETH.forEach((toothCode) => {
    current[toothCode] = { status: 'ok', cariePercentual: null }
  })

  if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
    Object.entries(rawValue).forEach(([tooth, value]) => {
      const isObject = value && typeof value === 'object' && !Array.isArray(value)
      const statusBruto = isObject
        ? (value.status ?? value.Status ?? '')
        : value
      const status = String(statusBruto || '')
        .trim()
        .toLowerCase()
      const cariePercentual = isObject && (value?.cariePercentual != null || value?.CariePercentual != null)
        ? Number(value?.cariePercentual ?? value?.CariePercentual)
        : null

      if (Object.hasOwn(current, tooth) && Object.hasOwn(supportedStatusByValue, status)) {
        current[tooth] = {
          status,
          cariePercentual:
            status === 'carie' && Number.isFinite(cariePercentual) ? clamp(Math.round(cariePercentual), 1, 100) : null,
        }
      }
    })
  }

  return current
}

function toStatusLabel(toothEntry, fallbackStatus = DEFAULT_STATUS) {
  const status = toothEntry?.status || fallbackStatus
  return supportedStatusByValue[status] || supportedStatusByValue[fallbackStatus] || null
}

function isUpperTooth(toothCode) {
  if (!toothCode) {
    return true
  }

  const primeira = String(toothCode).trim().charAt(0)
  return primeira === '1' || primeira === '2' || primeira === '5' || primeira === '6'
}

function resolveToothVisualFill(toothCode, estadoTooth, previewStatus) {
  if (!toothCode || !estadoTooth) {
    return { fill: SVG_STATUS_STYLE_BY_VALUE.ok.fill, stroke: SVG_STATUS_STYLE_BY_VALUE.ok.stroke, cariePercentual: null }
  }

  const statusState = previewStatus || estadoTooth
  if (statusState?.status !== 'carie' && statusState?.value !== 'carie') {
    const estadoNormalizado = statusState?.status || statusState?.value
    return { ...(SVG_STATUS_STYLE_BY_VALUE[estadoNormalizado] || SVG_STATUS_STYLE_BY_VALUE.ok), cariePercentual: null }
  }

  const percentual = Number(statusState?.cariePercentual) || 100
  return { ...SVG_STATUS_STYLE_BY_VALUE.carie, cariePercentual: clamp(Math.round(percentual), 1, 100), upper: isUpperTooth(toothCode) }
}

function resolveMixedToothCodeFromDeciduousSlot(deciduousToothCode, odontogramaMap) {
  const permanentToothCode = DECIDUOUS_TO_PERMANENT_SLOT[deciduousToothCode]
  if (!permanentToothCode) {
    return deciduousToothCode
  }

  const permanentState = odontogramaMap?.[permanentToothCode]
  const deciduousState = odontogramaMap?.[deciduousToothCode]
  if (deciduousState?.status === 'ausente') {
    return permanentToothCode
  }

  return permanentState?.status && permanentState.status !== 'ok' ? permanentToothCode : deciduousToothCode
}

function resolvePreviewedToothState(toothCode, odontogramaMap, previewStatus) {
  if (previewStatus?.toothCode === toothCode) {
    return {
      ...(odontogramaMap?.[toothCode] || {}),
      status: previewStatus.status?.status || previewStatus.status?.value || DEFAULT_STATUS,
      cariePercentual: previewStatus.status?.cariePercentual ?? null,
    }
  }

  return odontogramaMap?.[toothCode]
}

function hasClinicalToothState(toothState) {
  return Boolean(toothState?.status && toothState.status !== 'ok')
}

function resolveMixedSlotTooth(permanentToothCode, odontogramaMap, previewStatus = null) {
  const deciduousToothCode = PERMANENT_SLOT_TO_DECIDUOUS[permanentToothCode]
  const effectivePreview =
    previewStatus && (previewStatus.toothCode === permanentToothCode || previewStatus.toothCode === deciduousToothCode)
      ? previewStatus
      : null
  const permanentState = resolvePreviewedToothState(permanentToothCode, odontogramaMap, effectivePreview)
  const deciduousState = deciduousToothCode ? resolvePreviewedToothState(deciduousToothCode, odontogramaMap, effectivePreview) : null
  const permanentHasClinicalState = hasClinicalToothState(permanentState)

  if (deciduousToothCode) {
    if (deciduousState?.status === 'ausente') {
      return permanentToothCode
    }

    if (deciduousState?.status === undefined || (deciduousState?.status && deciduousState.status !== 'ausente')) {
      return deciduousToothCode
    }

    return permanentHasClinicalState ? permanentToothCode : null
  }
  if (permanentHasClinicalState) {
    return permanentToothCode
  }

  return null
}

function extractSvgPathBounds(markup) {
  const xs = []
  const ys = []
  const pathMatches = markup.matchAll(SVG_PATH_DATA_PATTERN)

  for (const pathMatch of pathMatches) {
    const values = [...pathMatch[1].matchAll(SVG_NUMBER_PATTERN)].map((match) => Number(match[0]))

    for (let index = 0; index < values.length - 1; index += 2) {
      const x = values[index]
      const y = values[index + 1]
      if (Number.isFinite(x) && Number.isFinite(y)) {
        xs.push(x)
        ys.push(y)
      }
    }
  }

  if (!xs.length || !ys.length) {
    return null
  }

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const width = Math.max(1, maxX - minX)
  const height = Math.max(1, maxY - minY)
  const padding = Math.max(width, height) * 0.08

  return {
    x: minX - padding,
    y: minY - padding,
    width: width + padding * 2,
    height: height + padding * 2,
  }
}

function stripOuterToothGroupTransform(markup) {
  return markup.replace(/(<g\b[^>]*id="tooth-\d{2}"[^>]*)\stransform="[^"]*"/i, '$1')
}

function extractMixedToothSymbols(svgMarkup) {
  const symbols = {}
  const matches = svgMarkup.matchAll(SVG_TOOTH_GROUP_PATTERN)

  for (const match of matches) {
    const toothCode = match[1]
    const rawMarkup = match[0]
    const bounds = extractSvgPathBounds(rawMarkup)

    if (!bounds) {
      continue
    }

    symbols[toothCode] = {
      markup: stripOuterToothGroupTransform(rawMarkup),
      viewBox: `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`,
    }
  }

  return symbols
}

const MIXED_TOOTH_SYMBOLS = extractMixedToothSymbols(denticaoMistaSvg)

function getMixedToothSymbols() {
  const runtimeSymbols = parseMixedToothSymbolsWithDom(denticaoMistaSvg)
  if (!runtimeSymbols || Object.keys(runtimeSymbols).length === 0) {
    return MIXED_TOOTH_SYMBOLS
  }

  return {
    ...MIXED_TOOTH_SYMBOLS,
    ...runtimeSymbols,
  }
}

function getSlotPreviewStatus(slotCode, previewStatus) {
  if (!previewStatus) {
    return null
  }

  const deciduousToothCode = PERMANENT_SLOT_TO_DECIDUOUS[slotCode]
  if (previewStatus.toothCode === slotCode || previewStatus.toothCode === deciduousToothCode) {
    return previewStatus
  }

  return null
}

function getPreviewStateForTooth(toothCode, odontogramaMap, previewStatus) {
  const previewForThisTooth = previewStatus?.toothCode === toothCode
  if (!previewForThisTooth) {
    return odontogramaMap?.[toothCode] || { status: DEFAULT_STATUS, cariePercentual: null }
  }

  const previewStatusValue = previewStatus?.status || previewStatus?.value || DEFAULT_STATUS
  const previewCarie = previewStatus?.cariePercentual
  const statusFromPreview = previewStatusValue === 'carie'

  return {
    ...(odontogramaMap?.[toothCode] || {}),
    status: previewStatusValue,
    cariePercentual: statusFromPreview ? Number(previewCarie) : null,
  }
}

function setToothAvailability(toothElement, isAvailable) {
  toothElement.style.display = isAvailable ? '' : 'none'
  toothElement.style.pointerEvents = isAvailable ? 'auto' : 'none'
  toothElement.setAttribute('aria-hidden', isAvailable ? 'false' : 'true')
  if (!isAvailable) {
    toothElement.removeAttribute('role')
    toothElement.removeAttribute('tabindex')
    toothElement.removeAttribute('data-effective-tooth-code')
  }
}

function removeMixedHitboxes(svgElement) {
  svgElement.querySelectorAll('[data-mixed-hitbox="true"]').forEach((element) => element.remove())
}

function createMixedHitbox(svgElement, toothElement, toothCode, effectiveToothCode, status, isSelected) {
  if (!svgElement || !toothElement || !toothCode || !effectiveToothCode) {
    return
  }

  let bbox
  try {
    bbox = toothElement.getBBox()
  } catch {
    return
  }

  if (!bbox || !Number.isFinite(bbox.width) || !Number.isFinite(bbox.height) || bbox.width <= 0 || bbox.height <= 0) {
    return
  }

  const padding = Math.max(8, Math.min(bbox.width, bbox.height) * 0.08)
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rect.setAttribute('x', String(bbox.x - padding))
  rect.setAttribute('y', String(bbox.y - padding))
  rect.setAttribute('width', String(bbox.width + padding * 2))
  rect.setAttribute('height', String(bbox.height + padding * 2))
  rect.setAttribute('rx', String(padding))
  rect.setAttribute('data-mixed-hitbox', 'true')
  rect.setAttribute('data-effective-tooth-code', effectiveToothCode)
  rect.setAttribute('role', 'button')
  rect.setAttribute('tabindex', '0')
  rect.setAttribute('aria-label', `Selecionar dente ${effectiveToothCode}. Estado atual ${status.label}. Clique para editar.`)
  rect.style.fill = 'transparent'
  rect.style.stroke = isSelected ? 'rgba(5, 150, 105, 0.85)' : 'transparent'
  rect.style.strokeWidth = isSelected ? '7' : '0'
  rect.style.cursor = 'pointer'
  rect.style.pointerEvents = 'all'

  svgElement.appendChild(rect)
}

function applyToothVisualStyle(toothElement, visualStyle, isSelected) {
  const targets = [toothElement, ...toothElement.querySelectorAll('path, polygon, polyline, rect, circle, ellipse, line')]

  targets.forEach((target) => {
    target.style.fill = visualStyle.fill
    target.style.stroke = visualStyle.stroke
    target.style.strokeWidth = isSelected ? '4' : '2.4'
    target.style.opacity = isSelected ? '1' : '0.96'
    target.style.transition = 'fill 0.2s ease, stroke 0.2s ease'
  })
}

function parsePercentInput(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) {
    return NaN
  }

  return clamp(Number(digits) / 100, 0, 100)
}

function formatPercentInput(value) {
  const parsed = Number(value)
  const safeValue = Number.isFinite(parsed) ? clamp(parsed, 0, 100) : 0
  return `${safeValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

function formatPercentTypingInput(value) {
  const parsed = parsePercentInput(value)
  if (!Number.isFinite(parsed)) {
    return ''
  }

  return formatPercentInput(parsed)
}

function resolveFallbackToothStyle(toothCode, odontogramaMap, previewStatus) {
  const estadoAtual = resolveToothDisplayStatus(toothCode, odontogramaMap, previewStatus)
  const statusAtual = estadoAtual?.status || DEFAULT_STATUS
  if (statusAtual !== 'carie') {
    const palette = SVG_STATUS_STYLE_BY_VALUE[estadoAtual?.value || DEFAULT_STATUS] || SVG_STATUS_STYLE_BY_VALUE.ok
    return {
      backgroundImage: 'none',
      backgroundColor: palette.fill,
      borderColor: palette.stroke,
      color: 'var(--ink-900)',
    }
  }

  const percentual = Number(estadoAtual?.cariePercentual)
  const redPercent = clamp(Number.isFinite(percentual) ? Math.round(percentual) : 100, 1, 100)
  const gradientDirection = isUpperTooth(toothCode) ? 'to top' : 'to bottom'
  return {
    backgroundImage: `linear-gradient(${gradientDirection}, ${SVG_STATUS_STYLE_BY_VALUE.carie.fill} ${redPercent}%, ${SVG_STATUS_STYLE_BY_VALUE.ok.fill} ${100 - redPercent}%)`,
    color: 'var(--ink-900)',
    borderColor: SVG_STATUS_STYLE_BY_VALUE.carie.stroke,
  }
}

function getSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

function renderStatusBadge(toothCode, odontogramaMap) {
  return toStatusLabel(odontogramaMap?.[toothCode], DEFAULT_STATUS)
}

function resolveToothDisplayStatus(toothCode, odontogramaMap, previewStatus) {
  if (!toothCode) {
    return renderStatusBadge(toothCode, odontogramaMap)
  }

  if (!previewStatus) {
    const estado = toStatusLabel(odontogramaMap?.[toothCode], DEFAULT_STATUS)
    if (estado?.value) {
      return estado
    }

    return {
      value: DEFAULT_STATUS,
      label: 'Nao identificado',
      chipClass: 'bg-stone-50 border-stone-200 text-stone-700',
      apiSupported: true,
      status: DEFAULT_STATUS,
    }
  }

  return {
    ...previewStatus,
    value: previewStatus.value || previewStatus.status || DEFAULT_STATUS,
    status: previewStatus.status || previewStatus.value || DEFAULT_STATUS,
    label: previewStatus.label || toStatusLabel({ status: previewStatus.value || previewStatus.status }, DEFAULT_STATUS)?.label || '',
    chipClass:
      previewStatus.chipClass ||
      toStatusLabel({ status: previewStatus.value || previewStatus.status }, DEFAULT_STATUS)?.chipClass ||
      'bg-stone-50 border-stone-200 text-stone-700',
  }
}

function OdontogramaLayerRows({ rows, odontogramaMap, selectedToothCode, onSelectTooth, previewStatus }) {
  return rows.map((row) => (
    <div key={row.title} className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-500)]">{row.title}</h3>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {row.teeth.map((tooth) => {
          const currentStatus = resolveToothDisplayStatus(tooth, odontogramaMap, previewStatus?.toothCode === tooth ? previewStatus.status : null)
          const isActive = selectedToothCode === tooth
          const fallbackStyle = resolveFallbackToothStyle(
            tooth,
            odontogramaMap,
            previewStatus?.toothCode === tooth ? previewStatus.status : null,
          )

          return (
            <button
              key={tooth}
              type="button"
              aria-label={`Selecionar dente ${tooth}. Estado atual ${currentStatus.label}`}
              onClick={(event) => {
                onSelectTooth(tooth, {
                  x: event.clientX,
                  y: event.clientY,
                })
              }}
              className={`rounded-2xl border px-2 py-3 text-sm transition ${
                isActive
                  ? 'border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)] shadow-lg shadow-emerald-950/10'
                  : `text-[var(--ink-700)] hover:border-[var(--brand-500)]`
              }`}
              style={fallbackStyle}
              title={`Dente ${tooth}. Estado atual: ${currentStatus.label}`}
            >
              <div className="text-xs font-semibold text-[var(--ink-500)]">{tooth}</div>
              <div className={`mt-1 rounded-xl border px-2 py-1 text-[11px] ${currentStatus.chipClass}`}>
                {currentStatus.subtitle}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  ))
}

function OdontogramaLayer({ layer, odontogramaMap, selectedToothCode, onSelectTooth, previewStatus }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-[var(--ink-700)]">{layer.title}</h3>
      <div className="rounded-2xl border border-black/6 bg-white p-3">
        <OdontogramaLayerRows
          rows={layer.rows}
          odontogramaMap={odontogramaMap}
          selectedToothCode={selectedToothCode}
          onSelectTooth={onSelectTooth}
          previewStatus={previewStatus}
        />
      </div>
    </section>
  )
}

function OdontogramaInteractiveFallback({ odontogramaMap, selectedToothCode, onSelectTooth, previewStatus, orderedLayers }) {
  return (
    <div className="space-y-4">
      {orderedLayers.map((layer) => (
        <OdontogramaLayer
          key={layer.source}
          layer={layer}
          odontogramaMap={odontogramaMap}
          selectedToothCode={selectedToothCode}
          onSelectTooth={onSelectTooth}
          previewStatus={previewStatus}
        />
      ))}
    </div>
  )
}

function MixedToothSymbol({ slotCode, symbol, visualState, isSelected, isUpper }) {
  const symbolRef = useRef(null)
  const fillColor = visualState?.fill || SVG_STATUS_STYLE_BY_VALUE.ok.fill
  const strokeColor = visualState?.stroke || SVG_STATUS_STYLE_BY_VALUE.ok.stroke
  const isCarie = visualState?.cariePercentual && Number.isFinite(visualState.cariePercentual)
  const cariePercentual = isCarie ? clamp(Math.round(visualState.cariePercentual), 1, 100) : 100
  const gradientId = `mixed-carie-${slotCode}`
  const gradientNode = isCarie ? (
    <linearGradient id={gradientId} x1="0%" y1={isUpper ? '100%' : '0%'} x2="0%" y2={isUpper ? '0%' : '100%'}>
      <stop offset={`${cariePercentual}%`} stopColor={SVG_STATUS_STYLE_BY_VALUE.carie.fill} />
      <stop offset={`${cariePercentual}%`} stopColor={SVG_STATUS_STYLE_BY_VALUE.ok.fill} />
      <stop offset="100%" stopColor={SVG_STATUS_STYLE_BY_VALUE.ok.fill} />
    </linearGradient>
  ) : null

  useEffect(() => {
    const target = symbolRef.current
    if (!target) {
      return
    }

    const targets = [target, ...target.querySelectorAll(SVG_SHAPE_SELECTOR)]
    targets.forEach((shape) => {
      shape.style.fill = isCarie ? `url(#${gradientId})` : fillColor
      shape.style.stroke = strokeColor
      shape.style.strokeWidth = isSelected ? '4' : '2.4'
      shape.style.opacity = '1'
      shape.style.transition = 'fill 0.2s ease, stroke 0.2s ease'
    })
  }, [fillColor, gradientId, isCarie, isSelected, strokeColor])

  if (!symbol?.markup) {
    return null
  }

  return (
    <svg viewBox={symbol.viewBox} className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>{gradientNode}</defs>
      <g ref={symbolRef} dangerouslySetInnerHTML={{ __html: symbol.markup }} />
    </svg>
  )
}

function MixedDentitionSlotGrid({ odontogramaMap, selectedToothCode, onSelectTooth, previewStatus }) {
  const permanentLayer = TEETH_LAYERS.find((layer) => layer.source === 'permanente')
  const mixedToothSymbols = useMemo(() => getMixedToothSymbols(), [])

  if (!permanentLayer) {
    return null
  }

  return (
    <section className="space-y-3 rounded-2xl border border-black/6 bg-white p-3" role="region" aria-label="Denticao mista">
      <div className="text-sm font-semibold text-[var(--ink-700)]">Dentição mista</div>
      {!MIXED_TOOTH_VALIDATION.isValid ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Simbolos da denticao mista em arquivo sao fracos. O painel usa fallback textual para posicoes sem simbolo detectado.
        </div>
      ) : null}
      <div className="space-y-4">
        {permanentLayer.rows.map((row) => (
          <div key={row.title} className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-500)]">{row.title}</div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {row.teeth.map((slotCode) => {
                const slotPreview = getSlotPreviewStatus(slotCode, previewStatus)
                const activeToothCode = resolveMixedSlotTooth(slotCode, odontogramaMap, slotPreview)
                const selectedInSlot =
                  selectedToothCode === slotCode ||
                  selectedToothCode === activeToothCode ||
                  selectedToothCode === PERMANENT_SLOT_TO_DECIDUOUS[slotCode]
                const activeState = activeToothCode ? getPreviewStateForTooth(activeToothCode, odontogramaMap, slotPreview) : null
                const visualState = activeToothCode ? resolveToothVisualFill(activeToothCode, activeState, slotPreview) : null
                const symbol = activeToothCode ? mixedToothSymbols?.[activeToothCode] : null
                const status = activeToothCode
                  ? resolveToothDisplayStatus(
                    activeToothCode,
                    odontogramaMap,
                    slotPreview?.toothCode === activeToothCode ? slotPreview : null,
                  )
                  : null
                const deciduousCode = PERMANENT_SLOT_TO_DECIDUOUS[slotCode]
                const clickToothCode = activeToothCode || deciduousCode || slotCode
                const label = activeToothCode
                  ? `Selecionar dente ${activeToothCode} no espaco ${slotCode}. Estado atual ${status.label}`
                  : `Selecionar espaco ${slotCode} vazio. Escolha um dente para adicionar.`
                const hasSymbol = Boolean(activeToothCode && symbol?.markup)

                return (
                  <button
                    key={slotCode}
                    type="button"
                    aria-label={label}
                    title={label}
                    onClick={(event) => {
                      onSelectTooth(clickToothCode, {
                        x: event.clientX,
                        y: event.clientY,
                        slotCode: slotCode,
                      })
                    }}
                    className={`min-h-[96px] rounded-2xl border px-2 py-3 text-sm transition ${
                      selectedInSlot
                        ? 'border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)] shadow-lg shadow-emerald-950/10'
                        : 'border-black/8 text-[var(--ink-700)] hover:border-[var(--brand-500)]'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-500)] focus:ring-offset-white`}
                    style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}
                    data-testid="odontograma-mixed-slot"
                    data-slot-code={slotCode}
                    data-active-tooth-code={activeToothCode || ''}
                    data-symbol-ok={hasSymbol ? 'true' : 'false'}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-500)]">
                        Slot {slotCode}
                      </span>
                      {deciduousCode ? (
                        <span className="rounded-full bg-white/75 px-2 py-0.5 text-[10px] text-[var(--ink-500)]">
                          {deciduousCode}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex h-20 w-full items-center justify-center rounded-lg border border-black/10 bg-white/70">
                      {activeToothCode ? (
                        hasSymbol ? (
                          <MixedToothSymbol
                            slotCode={activeToothCode}
                            symbol={symbol}
                            visualState={visualState}
                            isSelected={selectedInSlot}
                            isUpper={isUpperTooth(activeToothCode)}
                          />
                        ) : (
                          <div className="text-xs text-amber-700">Simbolo indisponivel para {activeToothCode}</div>
                        )
                      ) : (
                        <div className="text-xs text-[var(--ink-500)]">Espaco vazio</div>
                      )}
                    </div>
                    {activeToothCode ? (
                      <div className={`mt-2 rounded-xl border px-2 py-1 text-[11px] ${status.chipClass}`}>{status.subtitle}</div>
                    ) : (
                      <div className="mt-2 rounded-xl border border-dashed border-black/15 bg-white/70 px-2 py-3 text-xs text-[var(--ink-500)]">
                        Slot vazio
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-[var(--ink-500)]">
        A denticao mista usa 32 espacos permanentes. Os deciduos aparecem nos espacos correspondentes ate serem removidos ou substituidos.
      </p>
    </section>
  )
}

function OdontogramaInteractiveSvg({
  odontogramaMap,
  selectedToothCode,
  onSelectTooth,
  previewStatus,
  orderedLayers,
  ordemDescricao = '',
  denticaoAtiva = 'Permanente',
}) {
  const layerRefs = useRef({})
  const isMixedDentition = normalizarDenticao(denticaoAtiva) === 'Mista'
  const orderedSvgLayers = useMemo(
    () =>
      isMixedDentition
        ? [ODO_GRAPHS_WITH_VALID_IDS.find((svgLayer) => svgLayer.source === 'decidua')].filter(Boolean)
        : orderedLayers?.map((layer) => ODO_GRAPHS_WITH_VALID_IDS.find((svgLayer) => svgLayer.source === layer.source)).filter(Boolean) ??
          ODO_GRAPHS_WITH_VALID_IDS,
    [isMixedDentition, orderedLayers],
  )

  const atualizarVisualDosDentes = useCallback(
    (layer) => {
      const layerContainer = layerRefs.current[layer.source]
      if (!layerContainer) {
        return
      }

      const svgElement = layerContainer.querySelector('svg')
      if (!svgElement) {
        return
      }

      svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet')
      svgElement.style.width = '100%'
      svgElement.style.height = '100%'
      svgElement.style.maxHeight = '100%'
      svgElement.style.display = 'block'
      svgElement.style.pointerEvents = 'none'
      removeMixedHitboxes(svgElement)

      const toothElements = svgElement.querySelectorAll('[id^="tooth-"]')
      let defs = svgElement.querySelector('defs[data-carie-porcentagem]')
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
        defs.setAttribute('data-carie-porcentagem', 'true')
        svgElement.insertBefore(defs, svgElement.firstChild)
      } else {
        defs.innerHTML = ''
      }

      toothElements.forEach((toothElement) => {
        const toothCode = toothElement.getAttribute('id')?.replace('tooth-', '')

        if (!toothCode || !layer.toothCodes.includes(toothCode)) {
          return
        }

        setToothAvailability(toothElement, true)

        const effectiveToothCode =
          isMixedDentition && DECIDUOUS_TO_PERMANENT_SLOT[toothCode] ? resolveMixedToothCodeFromDeciduousSlot(toothCode, odontogramaMap) : toothCode
        const estadoAtual = odontogramaMap?.[effectiveToothCode] || { status: DEFAULT_STATUS, cariePercentual: null }
        const status = resolveToothDisplayStatus(
          effectiveToothCode,
          odontogramaMap,
          previewStatus?.toothCode === effectiveToothCode ? previewStatus.status : null,
        )
        const visualState = resolveToothVisualFill(
          effectiveToothCode,
          estadoAtual,
          previewStatus?.toothCode === effectiveToothCode ? previewStatus.status : null,
        )
        const percentual = visualState.cariePercentual || 100
        const estaSelecionado = effectiveToothCode === selectedToothCode

        if (visualState.cariePercentual) {
          const gradientId = `carie-gradient-${layer.source}-${toothCode}`
          const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
          gradient.setAttribute('id', gradientId)
          gradient.setAttribute('x1', '0%')
          gradient.setAttribute('y1', visualState.upper ? '100%' : '0%')
          gradient.setAttribute('x2', '0%')
          gradient.setAttribute('y2', visualState.upper ? '0%' : '100%')

          const redStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
          redStop.setAttribute('offset', `${percentual}%`)
          redStop.setAttribute('stop-color', SVG_STATUS_STYLE_BY_VALUE.carie.fill)

          const okStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
          okStop.setAttribute('offset', `${percentual}%`)
          okStop.setAttribute('stop-color', SVG_STATUS_STYLE_BY_VALUE.ok.fill)

          const okStopEnd = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
          okStopEnd.setAttribute('offset', '100%')
          okStopEnd.setAttribute('stop-color', SVG_STATUS_STYLE_BY_VALUE.ok.fill)

          gradient.append(redStop, okStop, okStopEnd)
          defs.appendChild(gradient)
          applyToothVisualStyle(
            toothElement,
            { fill: `url(#${gradientId})`, stroke: visualState.stroke || SVG_STATUS_STYLE_BY_VALUE.carie.stroke },
            estaSelecionado,
          )
        } else {
          const palette = SVG_STATUS_STYLE_BY_VALUE[status.value] || SVG_STATUS_STYLE_BY_VALUE.ok
          applyToothVisualStyle(toothElement, palette, estaSelecionado)
        }

        if (isMixedDentition) {
          toothElement.setAttribute('aria-hidden', 'true')
          toothElement.removeAttribute('role')
          toothElement.removeAttribute('tabindex')
          toothElement.removeAttribute('aria-label')
          toothElement.removeAttribute('data-effective-tooth-code')
          toothElement.style.cursor = 'default'
          createMixedHitbox(svgElement, toothElement, toothCode, effectiveToothCode, status, estaSelecionado)
        } else {
          toothElement.setAttribute('role', 'button')
          toothElement.setAttribute('tabindex', '0')
          toothElement.setAttribute(
            'aria-label',
            `Selecionar dente ${effectiveToothCode}. Estado atual ${status.label}. Clique para editar.`,
          )
          toothElement.setAttribute('data-effective-tooth-code', effectiveToothCode)
          toothElement.style.cursor = 'pointer'
        }
      })
    },
    [isMixedDentition, odontogramaMap, previewStatus, selectedToothCode],
  )

  useEffect(() => {
    orderedSvgLayers.forEach((layer) => {
      atualizarVisualDosDentes(layer)
    })
  }, [atualizarVisualDosDentes, orderedSvgLayers])

  const ativarDentePorTarget = useCallback(
    (target, source, event) => {
      const toothNode = target.closest('[data-effective-tooth-code], [id^="tooth-"]')

      if (!toothNode) {
        return
      }

      const toothCode = toothNode.getAttribute('data-effective-tooth-code') || toothNode.getAttribute('id')?.replace('tooth-', '')
      const rect = target.getBoundingClientRect()
      const pointerX = event?.clientX || rect.left + rect.width / 2
      const pointerY = event?.clientY || rect.top + rect.height / 2

      if (toothCode) {
        onSelectTooth(toothCode, {
          x: pointerX,
          y: pointerY,
          source,
        })
      }
    },
    [onSelectTooth],
  )

  const onClickSvg = useCallback(
    (event) => {
      if (!(event.target instanceof Element)) {
        return
      }

      const source = event.currentTarget?.getAttribute('data-layer')
      ativarDentePorTarget(event.target, source || 'permanente', event)
    },
    [ativarDentePorTarget],
  )

  const onKeyDownSvg = useCallback(
    (event) => {
      if (!(event.target instanceof Element)) {
        return
      }

      if (event.key !== 'Enter' && event.key !== ' ') {
        return
      }

      event.preventDefault()
      const source = event.currentTarget?.getAttribute('data-layer')
      ativarDentePorTarget(event.target, source || 'permanente', event)
    },
    [ativarDentePorTarget],
  )

  return (
    <div className="space-y-4">
      {orderedSvgLayers.map((item) => {
        const svgConfig = SVG_CANVAS_SIZES[item.source] || SVG_CANVAS_SIZES.decidua
        const interactiveLabel = isMixedDentition
          ? 'Denticao mista'
          : `Denticao ${item.source === 'permanente' ? 'permanente' : 'deciduo'}`
        const title = isMixedDentition ? 'Dentição mista' : item.title

        return (
          <section key={item.source} className="space-y-2 rounded-2xl border border-black/6 bg-white p-3">
            <div className="text-sm font-semibold text-[var(--ink-700)]">
              {title}
            </div>
            <div
              ref={(element) => {
                layerRefs.current[item.source] = element
              }}
              role="region"
              aria-label={interactiveLabel}
              onClick={onClickSvg}
              onKeyDown={onKeyDownSvg}
              tabIndex={-1}
              data-layer={item.source}
              className={`svg-interactive-wrap mx-auto overflow-hidden ${svgConfig.wrapperClass} ${svgConfig.svgHeightClass} w-full cursor-crosshair`}
              dangerouslySetInnerHTML={{ __html: item.file }}
            />
          </section>
        )
      })}
      {ordemDescricao ? <p className="text-[10px] text-[var(--ink-500)]">{ordemDescricao}</p> : null}
      <p className="text-xs text-[var(--ink-500)]">
        Camada interativa ativa apenas para a denticao selecionada. O clique em cada dente atualiza o estado atual no painel.
      </p>
    </div>
  )
}

function OdontogramaPainel({
  prontuario,
  carregandoProntuario,
  selectedToothCode,
  onSelectTooth,
  denticaoAtiva,
  previewStatus,
  onSelecionarDenticao,
}) {
  if (carregandoProntuario) {
    return <p className="text-sm text-[var(--ink-500)]">Carregando prontuario do paciente...</p>
  }

  if (!prontuario) {
    return <p className="text-sm text-[var(--ink-500)]">Selecione um paciente para carregar o prontuario e editar.</p>
  }

  const denticaoNormalizada = normalizarDenticao(denticaoAtiva)
  const isMista = denticaoNormalizada === 'Mista'
  const orderedLayers = isMista
    ? TEETH_LAYERS.filter((layer) => layer.source === 'decidua')
    : TEETH_LAYERS.filter((layer) =>
      (denticaoNormalizada === 'Decidua' ? layer.source === 'decidua' : layer.source === 'permanente'))

  const previewState =
    selectedToothCode && previewStatus ? { toothCode: selectedToothCode, status: previewStatus } : null

  const ordemDescricao =
    isMista
      ? 'Visualizacao: denticao mista inicia pela arcada decidua; cada slot pode ser substituido pelo permanente correspondente.'
      : denticaoNormalizada === 'Decidua'
      ? 'Visualizacao: somente deciduos'
      : 'Visualizacao: somente permanentes'

  const missingIds = ODO_GRAPHS_WITH_VALID_IDS.flatMap((graph) =>
    graph.missingToothCodes.map((tooth) => `${graph.title}: ${tooth}`),
  )
  const useInteractiveSvg = HAS_STRUCTURED_SVG_IDS && missingIds.length === 0

  if (isMista) {
    return (
      <>
        <MixedDentitionSlotGrid
          odontogramaMap={prontuario.odontogramaMap}
          selectedToothCode={selectedToothCode}
          onSelectTooth={onSelectTooth}
          previewStatus={previewState}
        />
        <label className="grid gap-2 text-xs text-[var(--ink-600)]">
          <span className="font-semibold text-[var(--ink-700)]">Denticao ativa</span>
          <select
            value={denticaoNormalizada}
            onChange={(event) => onSelecionarDenticao(event.target.value)}
            className="rounded-2xl border border-black/8 bg-white px-3 py-2"
            aria-label="Denticao ativa"
            data-testid="denticao-ativa-select"
          >
            {DENTICAO_OPTIONS.map((opcao) => (
              <option key={opcao.value} value={opcao.value}>
                {opcao.label}
              </option>
            ))}
          </select>
        </label>
      </>
    )
  }

  if (!useInteractiveSvg) {
    return (
      <div className="space-y-4">
        <OdontogramaInteractiveFallback
          odontogramaMap={prontuario.odontogramaMap}
          selectedToothCode={selectedToothCode}
          onSelectTooth={onSelectTooth}
          previewStatus={previewState}
          orderedLayers={orderedLayers}
        />
        <label className="grid gap-2 text-xs text-[var(--ink-600)]">
          <span className="font-semibold text-[var(--ink-700)]">Denticao ativa</span>
          <select
            value={denticaoNormalizada}
            onChange={(event) => onSelecionarDenticao(event.target.value)}
            className="rounded-2xl border border-black/8 bg-white px-3 py-2"
            aria-label="Denticao ativa"
            data-testid="denticao-ativa-select"
          >
            {DENTICAO_OPTIONS.map((opcao) => (
              <option key={opcao.value} value={opcao.value}>
                {opcao.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-[var(--ink-500)]">
          Camada fallback por grade FDI ativa. IDs estruturais completos do SVG não foram encontrados para:
          {missingIds.length ? ` ${missingIds.join(', ')}` : ' validação dinâmica em runtime.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <OdontogramaInteractiveSvg
        odontogramaMap={prontuario.odontogramaMap}
        selectedToothCode={selectedToothCode}
        onSelectTooth={onSelectTooth}
        previewStatus={previewState}
        orderedLayers={orderedLayers}
        ordemDescricao={ordemDescricao}
        denticaoAtiva={denticaoNormalizada}
      />
      <label className="grid gap-2 text-xs text-[var(--ink-600)]">
        <span className="font-semibold text-[var(--ink-700)]">Denticao ativa</span>
        <select
          value={denticaoNormalizada}
          onChange={(event) => onSelecionarDenticao(event.target.value)}
          className="rounded-2xl border border-black/8 bg-white px-3 py-2"
          aria-label="Denticao ativa"
          data-testid="denticao-ativa-select"
        >
          {DENTICAO_OPTIONS.map((opcao) => (
            <option key={opcao.value} value={opcao.value}>
              {opcao.label}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}

function LegendaStatus({ options }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4">
      <div className="text-sm font-semibold text-[var(--ink-900)]">Legenda</div>
      <div className="mt-2 space-y-2 text-xs">
        {options.map((status) => (
          <div
            key={status.value}
            data-testid={`legenda-${status.value}`}
            className="flex items-center gap-2"
          >
            <span className={`inline-block h-3 w-3 rounded-full border ${status.chipClass}`} />
            <span className="text-[var(--ink-700)]">{status.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniPainelDente({
  toothSelecionado,
  opcaoSelecionada,
  statusSelecionado,
  onChangeStatus,
  cariePercentualSelecionado,
  onChangeCariePercentual,
  denticaoAtiva,
  onToggleMixedToothType,
  onSave,
  onCancel,
  feedbackStatus,
  isSaving,
  anchorX,
  anchorY,
  isOpen,
  previewMode = false,
}) {
  const feedbackComposed = previewMode ? 'Amostra visual local. Ainda nao salva.' : null
  const selectRef = useRef(null)
  const popoverRef = useRef(null)
  const [position, setPosition] = useState({
    left: `${MINI_PANEL_DEFAULT_ANCHOR.x}px`,
    top: `${MINI_PANEL_DEFAULT_ANCHOR.y}px`,
  })

  useEffect(() => {
    if (!isOpen) {
      return
    }

    selectRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const onEscape = (event) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [isOpen, onCancel])

  useEffect(() => {
    if (!isOpen || !popoverRef.current || typeof window === 'undefined') {
      return
    }

    const anchor = {
      x: Number.isFinite(anchorX) ? anchorX : MINI_PANEL_DEFAULT_ANCHOR.x,
      y: Number.isFinite(anchorY) ? anchorY : MINI_PANEL_DEFAULT_ANCHOR.y,
    }

    const updatePosition = () => {
      const bounds = popoverRef.current?.getBoundingClientRect()
      const fallback = {
        left: `${anchor.x}px`,
        top: `${anchor.y}px`,
      }

      if (!bounds || !Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)) {
        setPosition(fallback)
        return
      }

      setPosition(resolvePopoverAnchor(anchor.x, anchor.y, bounds.width, bounds.height))
    }

    const frame = requestAnimationFrame(updatePosition)
    return () => cancelAnimationFrame(frame)
  }, [isOpen, anchorX, anchorY, statusSelecionado, toothSelecionado])

  if (!isOpen || !toothSelecionado) {
    return null
  }

  const isMista = normalizarDenticao(denticaoAtiva) === 'Mista'
  const permanentCounterpart = DECIDUOUS_TO_PERMANENT_SLOT[toothSelecionado]
  const deciduousCounterpart = PERMANENT_SLOT_TO_DECIDUOUS[toothSelecionado]
  const mixedTarget = permanentCounterpart || deciduousCounterpart
  const mixedTargetLabel = permanentCounterpart ? `permanente ${permanentCounterpart}` : `deciduo ${deciduousCounterpart}`

  return (
    <section
      ref={popoverRef}
      style={{ left: position.left, top: position.top }}
      className="fixed z-30 w-[min(100%-24px,320px)] max-w-sm rounded-2xl border border-black/10 bg-white p-4 shadow-xl"
      role="dialog"
      aria-live="polite"
      aria-modal="true"
      aria-label={`Edicao do dente ${toothSelecionado}`}
    >
      <div className="space-y-4">
        <div className="text-sm text-[var(--ink-500)]">
          Dente <span className="font-semibold text-[var(--ink-900)]">{toothSelecionado}</span>
        </div>
        <div className="text-sm">
          Estado atual: <span className="font-semibold text-[var(--ink-900)]">{opcaoSelecionada?.label || 'Nao identificado'}</span>
        </div>
        {isMista && mixedTarget ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <div className="font-semibold">Denticao mista</div>
            <p className="mt-1 text-xs">
              Este espaco pode alternar entre o dente deciduo e o permanente correspondente.
            </p>
            <button
              type="button"
              className="mt-3 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-950"
              disabled={isSaving}
              onClick={() => onToggleMixedToothType(toothSelecionado)}
            >
              Trocar para {mixedTargetLabel}
            </button>
          </div>
        ) : null}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSave()
          }}
          className="grid gap-3"
        >
          <label className="grid gap-2 text-sm">
            <span className="font-semibold text-[var(--ink-700)]">Novo estado</span>
            <select
              id="statusDente"
              ref={selectRef}
              value={statusSelecionado}
              onChange={onChangeStatus}
              disabled={isSaving}
              className="rounded-2xl border border-black/8 px-3 py-2 text-sm outline-none"
            >
              {LEGEND_OPTIONS.map((status) => (
                <option key={status.value} value={status.value} disabled={!status.apiSupported}>
                  {status.label}
                  {!status.apiSupported ? ' (aguardando backend)' : ''}
                </option>
              ))}
            </select>
          </label>
          {(statusSelecionado === 'carie' || opcaoSelecionada?.value === 'carie') && (
            <label className="grid gap-2 text-sm">
              <span className="font-semibold text-[var(--ink-700)]">Percentual de cárie</span>
              <input
                type="text"
                inputMode="numeric"
                value={String(cariePercentualSelecionado ?? '')}
                onChange={onChangeCariePercentual}
                disabled={isSaving}
                className="rounded-2xl border border-black/8 px-3 py-2 text-sm outline-none"
                aria-label="Percentual da cárie"
                placeholder="0,00%"
              />
            </label>
          )}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={onCancel} className="rounded-2xl border border-black/12 px-4 py-2 text-sm">
              Cancelar
            </button>
          </div>
        </form>
        <FeedbackMessage type="error" message={feedbackStatus || feedbackComposed} />
      </div>
    </section>
  )
}

function ResumoProntuario({ pacienteSelecionado, prontuario }) {
  return (
    <section className="soft-card p-6">
      <h3 className="text-lg font-semibold text-[var(--ink-900)]">Resumo do prontuario</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm">
          <div className="text-[var(--ink-500)]">Paciente</div>
          <div className="mt-1 font-semibold text-[var(--ink-900)]">{pacienteSelecionado?.nome || 'Nao selecionado'}</div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm">
          <div className="text-[var(--ink-500)]">Prontuario ID</div>
          <div className="mt-1 font-mono text-xs text-[var(--ink-900)]">{prontuario?.id || '-'}</div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm">
          <div className="text-[var(--ink-500)]">Ultima atualizacao do odontograma</div>
          <div className="mt-1 text-[var(--ink-900)]">{formatDateTime(prontuario?.odontogramaAtualizadoEmUtc)}</div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm">
          <div className="text-[var(--ink-500)]">Denticao ativa</div>
          <div className="mt-1 font-semibold text-[var(--ink-900)]">{prontuario?.denticaoAtiva || 'Permanente'}</div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm">
          <div className="text-[var(--ink-500)]">Situacao atual da anamnese</div>
          <div className="mt-1 text-[var(--ink-900)]">{prontuario?.anamneseDesatualizada ? 'Precisa atualizar' : 'Atualizada'}</div>
        </div>
      </div>
    </section>
  )
}

function useProntuarioState() {
  const [pacientes, setPacientes] = useState([])
  const [buscaPaciente, setBuscaPaciente] = useState('')
  const [carregandoPacientes, setCarregandoPacientes] = useState(true)
  const [carregandoProntuario, setCarregandoProntuario] = useState(false)
  const [pacienteSelecionadoId, setPacienteSelecionadoId] = useState('')

  const [prontuario, setProntuario] = useState(null)
  const [carregandoAtualizacao, setCarregandoAtualizacao] = useState(false)
  const [feedbackErro, setFeedbackErro] = useState('')
  const [feedbackInfo, setFeedbackInfo] = useState('')
  const [toothSelecionado, setToothSelecionado] = useState('')
  const [statusSelecionado, setStatusSelecionado] = useState(DEFAULT_STATUS)
  const [cariePercentualSelecionado, setCariePercentualSelecionado] = useState('')
  const [statusError, setStatusError] = useState('')
  const [popoverAnchor, setPopoverAnchor] = useState({ x: 12, y: 12, source: null })
  const [previewStatus, setPreviewStatus] = useState(null)
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const mixedSlotFocusRef = useRef(null)

  const pacientesFiltrados = useMemo(() => {
    const normalizedSearch = getSearchText(buscaPaciente)
    const numericSearch = onlyDigits(buscaPaciente)

    if (!normalizedSearch && !numericSearch) {
      return pacientes
    }

    return pacientes.filter((paciente) => {
      const textoIndexado = [
        getSearchText(paciente.nome),
        getSearchText(paciente.cpf),
        getSearchText(paciente.Cpf),
        getSearchText(paciente.telefoneWhatsapp),
        getSearchText(paciente.TelefoneWhatsapp),
        getSearchText(paciente.email),
        getSearchText(paciente.Email),
        getSearchText(paciente.convenio),
        getSearchText(paciente.Convenio),
      ]
        .filter(Boolean)
        .join(' ')

      const normalizedDigits = [
        onlyDigits(paciente.cpf || paciente.Cpf || ''),
        onlyDigits(paciente.telefoneWhatsapp || paciente.TelefoneWhatsapp || ''),
      ].join(' ')

      const textoMatch = textoIndexado.includes(normalizedSearch)
      const numericMatch = numericSearch ? normalizedDigits.includes(numericSearch) : false

      return textoMatch || numericMatch
    })
  }, [buscaPaciente, pacientes])

  const pacienteSelecionado = useMemo(
    () => pacientes.find((paciente) => paciente.id === pacienteSelecionadoId),
    [pacientes, pacienteSelecionadoId],
  )

  const opcaoSelecionada = useMemo(() => {
    if (!toothSelecionado) {
      return null
    }

    if (!prontuario?.odontogramaMap || !Object.hasOwn(prontuario.odontogramaMap, toothSelecionado)) {
      return null
    }

    return toStatusLabel(prontuario.odontogramaMap[toothSelecionado], DEFAULT_STATUS)
  }, [prontuario, toothSelecionado])

  const denticaoAtiva = normalizarDenticao(prontuario?.denticaoAtiva || 'Permanente')
  const isMista = denticaoAtiva === 'Mista'
  const activeCodeSet = useMemo(
    () => new Set(isMista ? TODAS_TEETH : DENTES_POR_DENTICAO[denticaoAtiva.toLowerCase()]),
    [denticaoAtiva, isMista],
  )
  const temAlteracoesNaDenticaoAtiva = useMemo(() => {
    if (!prontuario?.odontogramaMap) {
      return false
    }

    return Object.entries(prontuario.odontogramaMap).some(([tooth, estado]) => {
      if (!activeCodeSet.has(tooth)) {
        return false
      }

      return estado?.status && estado.status !== 'ok'
    })
  }, [activeCodeSet, prontuario])

  const carregarProntuario = useCallback(async (pacienteId) => {
    if (!pacienteId) {
      setProntuario(null)
      setToothSelecionado('')
      setStatusError('')
      setFeedbackInfo('')
      return
    }

    setFeedbackErro('')
    setFeedbackInfo('')
    setStatusError('')
    setCarregandoProntuario(true)

    try {
      const data = await getProntuarioPorPaciente(pacienteId)
      setProntuario({
        ...data,
        odontogramaMap: normalizeToothMap(data?.odontograma),
      })
      setToothSelecionado('')
      setPreviewStatus(null)
      setStatusSelecionado(DEFAULT_STATUS)
      setCariePercentualSelecionado('')
      setStatusError('')
      setPopoverAnchor({
        x: 12,
        y: 12,
        source: null,
      })
    } catch (error) {
      setFeedbackErro(getApiErrorMessage(error, 'Nao foi possivel carregar o prontuario.'))
    } finally {
      setCarregandoProntuario(false)
    }
  }, [])

  const resolveMixedSlotForFocus = useCallback((toothCode) => {
    const codigo = String(toothCode || '').trim()
    if (!codigo) {
      return null
    }

    if (DECIDUOUS_TO_PERMANENT_SLOT[codigo]) {
      return DECIDUOUS_TO_PERMANENT_SLOT[codigo]
    }

    return codigo
  }, [])

  const focusMixedSlotButton = useCallback((slotCode) => {
    if (!slotCode) {
      return
    }

    const slot = document.querySelector(`[data-testid="odontograma-mixed-slot"][data-slot-code="${slotCode}"]`)
    if (slot instanceof HTMLElement) {
      slot.focus()
    }
  }, [])

  const selecionarPaciente = useCallback(
    (novoPacienteId) => {
      setPacienteSelecionadoId(novoPacienteId)
      setFeedbackErro('')
      setFeedbackInfo('')
      setStatusError('')
      setToothSelecionado('')
      setStatusSelecionado(DEFAULT_STATUS)
      setCariePercentualSelecionado('')
      setPreviewStatus(null)
      setPopoverAnchor({ x: 12, y: 12, source: null })
      void carregarProntuario(novoPacienteId)
    },
    [carregarProntuario],
  )

  const selecionarDente = useCallback(
    (toothCode, pointer) => {
      if (!prontuario?.odontogramaMap) {
        return
      }

      const denticaoNormalizada = normalizarDenticao(denticaoAtiva)
      if (denticaoNormalizada === 'Mista') {
        mixedSlotFocusRef.current = resolveMixedSlotForFocus(pointer?.slotCode || toothCode)
      } else {
        mixedSlotFocusRef.current = null
      }

      setStatusError('')
      setToothSelecionado(toothCode)
      const estadoAtual = prontuario.odontogramaMap[toothCode]
      setStatusSelecionado(estadoAtual?.status || DEFAULT_STATUS)
      setCariePercentualSelecionado(
        Number.isFinite(Number(estadoAtual?.cariePercentual))
          ? formatPercentInput(clamp(Number(estadoAtual.cariePercentual), 0, 100))
          : '',
      )
      setPreviewStatus(null)
      setPopoverAnchor(
        pointer && Number.isFinite(pointer.x) && Number.isFinite(pointer.y)
          ? {
              x: Math.round(pointer.x),
              y: Math.round(pointer.y),
              source: pointer.source || null,
            }
          : {
              x: 12,
              y: 12,
              source: null,
            },
      )
    },
    [denticaoAtiva, prontuario, resolveMixedSlotForFocus],
  )

  const salvarStatus = useCallback(async () => {
    if (!prontuario?.id || !toothSelecionado) {
      return false
    }

    const estadoNormalizado = statusSelecionado.trim().toLowerCase()
    const estadoEscolhido = supportedStatusByValue[estadoNormalizado]

    if (!API_SUPPORTED_STATUS_VALUES.includes(estadoNormalizado) || !estadoEscolhido?.apiSupported) {
      setStatusError('Estado invalido para persistencia no backend atual.')
      return false
    }

    setCarregandoAtualizacao(true)
    setStatusError('')
    setFeedbackInfo('')

    try {
      const percentualDigitado = parsePercentInput(cariePercentualSelecionado)
      const percentualCarie = estadoNormalizado === 'carie' && Number.isFinite(percentualDigitado) ? percentualDigitado : null
      const data = await atualizarOdontogramaDente(prontuario.id, toothSelecionado, estadoNormalizado, percentualCarie)
      setProntuario({
        ...data,
        odontogramaMap: normalizeToothMap(data?.odontograma),
      })
      setFeedbackInfo('Estado do dente atualizado com sucesso.')
      setTimeout(() => {
        setFeedbackInfo('')
      }, 2500)

      return true
    } catch (error) {
      setStatusError(getApiErrorMessage(error, 'Nao foi possivel atualizar o estado do dente.'))
      return false
    } finally {
      setCarregandoAtualizacao(false)
    }
  }, [cariePercentualSelecionado, prontuario, statusSelecionado, toothSelecionado])

  const cancelarEdicao = useCallback(() => {
    const slotParaFoco = normalizarDenticao(denticaoAtiva) === 'Mista' ? mixedSlotFocusRef.current : null
    mixedSlotFocusRef.current = null

    setToothSelecionado('')
    setPreviewStatus(null)
    setStatusError('')
    setStatusSelecionado(DEFAULT_STATUS)
    setCariePercentualSelecionado('')
    setPopoverAnchor({
      x: 12,
      y: 12,
      source: null,
    })

    if (slotParaFoco) {
      requestAnimationFrame(() => focusMixedSlotButton(slotParaFoco))
    }
  }, [denticaoAtiva, focusMixedSlotButton])

  const onStatusChange = useCallback((event) => {
    const novoStatus = event.target.value
    setStatusSelecionado(novoStatus)
    setStatusError('')
    const statusSelecionadoDefinido = supportedStatusByValue[novoStatus] || { value: novoStatus }
    setPreviewStatus({
      ...statusSelecionadoDefinido,
      status: novoStatus,
      value: novoStatus,
      cariePercentual:
        novoStatus === 'carie' && Number.isFinite(parsePercentInput(cariePercentualSelecionado))
          ? parsePercentInput(cariePercentualSelecionado)
          : null,
    })
    if (novoStatus !== 'carie') {
      setCariePercentualSelecionado('')
    }
  }, [cariePercentualSelecionado])

  const onCariePercentualChange = useCallback(
    (event) => {
      const valor = formatPercentTypingInput(event.target.value)
      setCariePercentualSelecionado(valor)
      const percentual = parsePercentInput(valor)
      if (statusSelecionado === 'carie' && Number.isFinite(percentual)) {
        setPreviewStatus({
          ...supportedStatusByValue.carie,
          status: 'carie',
          value: 'carie',
          cariePercentual: percentual,
        })
      }
    },
    [statusSelecionado],
  )

  const onToggleMixedToothType = useCallback(
    async (toothCode) => {
      if (!prontuario?.id || denticaoAtiva !== 'Mista') {
        return
      }

      const permanentCode = DECIDUOUS_TO_PERMANENT_SLOT[toothCode]
      const deciduousCode = PERMANENT_SLOT_TO_DECIDUOUS[toothCode]

      if (!permanentCode && !deciduousCode) {
        return
      }

      setCarregandoAtualizacao(true)
      setStatusError('')
      setFeedbackInfo('')

      try {
        const targetCode = permanentCode || deciduousCode
      let nextData

      if (permanentCode) {
        nextData = await atualizarOdontogramaDente(prontuario.id, toothCode, 'ausente', null)
        nextData = await atualizarOdontogramaDente(prontuario.id, permanentCode, 'ok', null)
      } else {
        nextData = await atualizarOdontogramaDente(prontuario.id, toothCode, 'ausente', null)
        nextData = await atualizarOdontogramaDente(prontuario.id, deciduousCode, 'ok', null)
        }

        const odontogramaMap = normalizeToothMap(nextData?.odontograma)
        setProntuario({
          ...nextData,
          odontogramaMap,
        })
        setToothSelecionado(targetCode)
        const estadoAtual = odontogramaMap[targetCode]
        setStatusSelecionado(estadoAtual?.status || DEFAULT_STATUS)
        setCariePercentualSelecionado(
          Number.isFinite(Number(estadoAtual?.cariePercentual))
            ? formatPercentInput(clamp(Number(estadoAtual.cariePercentual), 0, 100))
            : '',
        )
        setPreviewStatus(null)
        setFeedbackInfo(`Espaco alterado para dente ${targetCode}.`)
      } catch (error) {
        setStatusError(getApiErrorMessage(error, 'Nao foi possivel trocar o tipo do dente neste espaco.'))
      } finally {
        setCarregandoAtualizacao(false)
      }
    },
    [denticaoAtiva, prontuario],
  )

  const onSelecionarDenticao = useCallback(
    async (novaDenticao) => {
    if (!prontuario?.id) {
      return
    }

    const denticaoNormalizada = normalizarDenticao(novaDenticao)
    if (!denticaoNormalizada || denticaoNormalizada === denticaoAtiva) {
      return
    }

    if (temAlteracoesNaDenticaoAtiva && denticaoNormalizada !== denticaoAtiva) {
      const confirmacao = window.confirm(
        `Existem alteracoes na denticao ${denticaoAtiva}. Deseja trocar para ${denticaoNormalizada} mantendo todos os dados?`,
      )
      if (!confirmacao) {
        return
      }
    }

    setCarregandoAtualizacao(true)
    setStatusError('')
    try {
      const data = await atualizarDenticaoAtiva(prontuario.id, novaDenticao)
      setProntuario({
        ...data,
        odontogramaMap: normalizeToothMap(data?.odontograma),
      })
      setToothSelecionado('')
      setStatusSelecionado(DEFAULT_STATUS)
      setCariePercentualSelecionado('')
      setPreviewStatus(null)
      setFeedbackInfo(`Denticao alterada para ${novaDenticao}.`)
      setTimeout(() => {
        setFeedbackInfo('')
      }, 2500)
    } catch (error) {
      setFeedbackErro(getApiErrorMessage(error, 'Nao foi possivel trocar a denticao.'))
    } finally {
      setCarregandoAtualizacao(false)
    }
  },
    [denticaoAtiva, prontuario, temAlteracoesNaDenticaoAtiva],
  )

  const salvarStatusComFechamento = useCallback(async () => {
    const sucesso = await salvarStatus()
    if (sucesso) {
      cancelarEdicao()
    }
  }, [cancelarEdicao, salvarStatus])

  useEffect(() => {
    const loadPacientes = async () => {
      setFeedbackErro('')
      setCarregandoPacientes(true)

      try {
        const data = await getPacientes()
        setPacientes(Array.isArray(data) ? data : [])
      } catch (error) {
        setFeedbackErro(getApiErrorMessage(error, 'Nao foi possivel carregar a lista de pacientes.'))
      } finally {
        setCarregandoPacientes(false)
      }
    }

    void loadPacientes()
  }, [])

  return {
    pacientes,
    buscaPaciente,
    setBuscaPaciente,
    carregandoPacientes,
    pacientesFiltrados,
    carregandoProntuario,
    pacienteSelecionado,
    pacienteSelecionadoId,
    feedbackErro,
    feedbackInfo,
    prontuario,
    toothSelecionado,
    statusSelecionado,
    opcaoSelecionada,
    statusError,
    carregandoAtualizacao,
    dropdownAberto,
    setDropdownAberto,
    denticaoAtiva,
    temAlteracoesNaDenticaoAtiva,
    popoverAnchor,
    previewStatus,
    cariePercentualSelecionado,
    selecionarPaciente,
    selecionarDente,
    onSelecionarDenticao,
    salvarStatus,
    salvarStatusComFechamento,
    onStatusChange,
    onCariePercentualChange,
    onToggleMixedToothType,
    cancelarEdicao,
  }
}

export default function Prontuario() {
  const { user, logout } = useAuth()

  const {
    buscaPaciente,
    setBuscaPaciente,
    dropdownAberto,
    setDropdownAberto,
    pacientesFiltrados,
    carregandoProntuario,
    feedbackErro,
    feedbackInfo,
    prontuario,
    toothSelecionado,
    statusSelecionado,
    statusError,
    cariePercentualSelecionado,
    selecionarPaciente,
    selecionarDente,
    salvarStatusComFechamento,
    pacienteSelecionado,
    opcaoSelecionada,
    carregandoAtualizacao,
    denticaoAtiva,
    popoverAnchor,
    previewStatus,
    onStatusChange,
    onCariePercentualChange,
    onToggleMixedToothType,
    cancelarEdicao,
    onSelecionarDenticao,
  } = useProntuarioState()

  return (
    <AppShell title="Prontuario" subtitle="Dados de atendimento e odontograma por dente." user={user} onLogout={logout}>
      <div className="space-y-6">
        <section className="surface-card p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[var(--ink-900)]">Selecionar paciente</h2>
            <p className="text-sm text-[var(--ink-500)]">
              Escolha um paciente para carregar o prontuario e editar os estados do odontograma.
            </p>

            <div className="grid gap-3">
              <div className="input-shell relative">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--ink-500)]" aria-hidden="true">
                  <path
                    d="M10.5 18a7.5 7.5 0 1 1 5.3-2.2L21 21"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <input
                  type="search"
                  value={buscaPaciente}
                  onChange={(event) => {
                    setBuscaPaciente(event.target.value)
                    setDropdownAberto(true)
                  }}
                  placeholder="Busque por nome, CPF ou telefone"
                  aria-label="Buscar paciente"
                  onFocus={() => setDropdownAberto(true)}
                  onBlur={() => {
                    window.setTimeout(() => setDropdownAberto(false), 150)
                  }}
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-500)]"
                />
                {buscaPaciente && dropdownAberto && pacientesFiltrados.length > 0 ? (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-auto rounded-2xl border border-black/10 bg-white p-2 shadow-lg">
                    <p className="mb-2 px-2 text-xs text-[var(--ink-500)]">
                      {`Resultados (max ${QUICK_PATIENT_SELECTION_LIMIT}):`}
                    </p>
                    <div className="space-y-2">
                      {pacientesFiltrados.slice(0, QUICK_PATIENT_SELECTION_LIMIT).map((paciente) => (
                        <button
                          key={paciente.id}
                          type="button"
                          onMouseDown={() => {
                            setBuscaPaciente(buildPacienteResumoLinha(paciente))
                            selecionarPaciente(paciente.id)
                            setDropdownAberto(false)
                          }}
                          className="block w-full rounded-md border border-black/10 px-2 py-2 text-left text-xs text-[var(--ink-800)]"
                          aria-label={`Selecionar paciente ${paciente.nome}`}
                        >
                          {buildPacienteResumoLinha(paciente)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              {pacientesFiltrados.length === 0 && buscaPaciente ? <span className="text-xs text-red-500">Nenhum paciente encontrado.</span> : null}
            </div>

            <FeedbackMessage type={feedbackErro ? 'error' : 'info'} message={feedbackErro || feedbackInfo} />
          </div>
        </section>

        <section className="surface-card p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:justify-between">
            <div className="space-y-3 flex-1">
              <h2 className="text-xl font-semibold text-[var(--ink-900)]">Odontograma visual</h2>
              <div className="rounded-3xl border border-black/6 bg-stone-50 p-4">
                <OdontogramaPainel
                  prontuario={prontuario}
                  carregandoProntuario={carregandoProntuario}
                  selectedToothCode={toothSelecionado}
                  onSelectTooth={selecionarDente}
                  denticaoAtiva={denticaoAtiva}
                  previewStatus={previewStatus}
                  onSelecionarDenticao={onSelecionarDenticao}
                />
              </div>
            </div>

            <div className="min-w-0 xl:w-[340px] space-y-4">
              <MiniPainelDente
                isOpen={Boolean(toothSelecionado)}
                toothSelecionado={toothSelecionado}
                opcaoSelecionada={opcaoSelecionada}
                statusSelecionado={statusSelecionado}
                onChangeStatus={onStatusChange}
                cariePercentualSelecionado={cariePercentualSelecionado}
                onChangeCariePercentual={onCariePercentualChange}
                denticaoAtiva={denticaoAtiva}
                onToggleMixedToothType={onToggleMixedToothType}
                onSave={() => void salvarStatusComFechamento()}
                onCancel={cancelarEdicao}
                feedbackStatus={statusError}
                isSaving={carregandoAtualizacao}
                anchorX={popoverAnchor.x}
                anchorY={popoverAnchor.y}
                previewMode={Boolean(previewStatus)}
              />

              <LegendaStatus options={LEGEND_OPTIONS} />
            </div>
          </div>
        </section>

        <ResumoProntuario pacienteSelecionado={pacienteSelecionado} prontuario={prontuario} />
      </div>
    </AppShell>
  )
}
