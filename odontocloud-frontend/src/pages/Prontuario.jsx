import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AppShell from '../components/AppShell'
import FeedbackMessage from '../components/FeedbackMessage'
import { getApiErrorMessage } from '../api/client'
import { getPacientes } from '../api/pacientes'
import { getProntuarioPorPaciente, atualizarOdontogramaDente } from '../api/prontuario'
import { useAuth } from '../hooks/useAuth'
import dentePermanenteSvg from '../assets/odontograma/Dente_permanente.svg?raw'
import denteDeciduoSvg from '../assets/odontograma/denticao_decidua.svg?raw'

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
    chipClass: 'bg-rose-50 border-rose-200 text-rose-800',
    apiSupported: true,
  },
]

const API_SUPPORTED_STATUS_VALUES = STATUS_OPTIONS.filter((status) => status.apiSupported).map((status) => status.value)
const supportedStatusByValue = Object.fromEntries(STATUS_OPTIONS.map((status) => [status.value, status]))
const DEFAULT_STATUS = API_SUPPORTED_STATUS_VALUES[0] || 'ok'
const ALL_TEETH = TEETH_LAYERS.flatMap((layer) => layer.rows.flatMap((row) => row.teeth))
const LEGEND_OPTIONS = STATUS_OPTIONS.filter((status) => status.apiSupported || status.value === 'protese')
const QUICK_PATIENT_SELECTION_LIMIT = 8
const SVG_CANVAS_SIZES = {
  permanente: {
    wrapperClass: 'w-full max-w-[min(100%,1200px)]',
    svgHeightClass: 'max-h-[440px]',
  },
  decidua: {
    wrapperClass: 'w-full max-w-[min(100%,840px)]',
    svgHeightClass: 'max-h-[330px]',
  },
}

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
  protese: { fill: '#fef2f2', stroke: '#dc2626' },
}

function getToothCodesFromSvgMarkup(svgMarkup) {
  const matches = svgMarkup.matchAll(/id="tooth-(\d{2})"/g)
  const values = new Set()

  for (const match of matches) {
    values.add(match[1])
  }

  return values
}

function getMissingToothCodesFromSvgMarkup(svgMarkup, targetCodes) {
  const availableCodes = getToothCodesFromSvgMarkup(svgMarkup)

  return targetCodes.filter((code) => !availableCodes.has(code))
}

const ODO_GRAPHS_WITH_VALID_IDS = ODO_GRAPHS_FOR_SVG_UPGRADE.map((layer) => {
  const toothCodes = TEETH_LAYERS.find((candidate) => candidate.source === layer.source)?.rows.flatMap((row) => row.teeth) || []
  const targetSet = new Set(toothCodes)
  const file = layer.source === 'permanente' ? dentePermanenteSvg : denteDeciduoSvg
  const missingToothCodes = getMissingToothCodesFromSvgMarkup(file, toothCodes).filter((code) => targetSet.has(code))

  return {
    ...layer,
    file,
    toothCodes,
    missingToothCodes,
  }
})

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

function normalizeToothMap(rawValue) {
  const current = {}

  ALL_TEETH.forEach((toothCode) => {
    current[toothCode] = 'ok'
  })

  if (rawValue && typeof rawValue === 'object' && !Array.isArray(rawValue)) {
    Object.entries(rawValue).forEach(([tooth, value]) => {
      const toothStatus = String(value || '')
        .trim()
        .toLowerCase()

      if (Object.hasOwn(current, tooth) && Object.hasOwn(supportedStatusByValue, toothStatus)) {
        current[tooth] = toothStatus
      }
    })
  }

  return current
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
  return supportedStatusByValue[odontogramaMap?.[toothCode]] || STATUS_OPTIONS[0]
}

function resolveToothDisplayStatus(toothCode, odontogramaMap, previewStatus) {
  if (!toothCode) {
    return renderStatusBadge(toothCode, odontogramaMap)
  }

  if (!previewStatus) {
    return renderStatusBadge(toothCode, odontogramaMap)
  }

  return previewStatus.value ? previewStatus : renderStatusBadge(toothCode, odontogramaMap)
}

function isAdultByBirthdate(dataNascimento) {
  if (!dataNascimento) {
    return null
  }

  const parsedDate = new Date(dataNascimento)
  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  const today = new Date()
  let age = today.getFullYear() - parsedDate.getFullYear()

  if (
    today.getMonth() < parsedDate.getMonth() ||
    (today.getMonth() === parsedDate.getMonth() && today.getDate() < parsedDate.getDate())
  ) {
    age -= 1
  }

  return age >= 18
}

function OdontogramaLayerRows({ rows, odontogramaMap, selectedToothCode, onSelectTooth, previewStatus }) {
  return rows.map((row) => (
    <div key={row.title} className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-500)]">{row.title}</h3>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {row.teeth.map((tooth) => {
          const currentStatus = resolveToothDisplayStatus(tooth, odontogramaMap, previewStatus?.toothCode === tooth ? previewStatus.status : null)
          const isActive = selectedToothCode === tooth

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
                  : 'border-black/10 bg-white text-[var(--ink-700)] hover:border-[var(--brand-500)]'
              }`}
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

function OdontogramaInteractiveSvg({ odontogramaMap, selectedToothCode, onSelectTooth, previewStatus, orderedLayers }) {
  const layerRefs = useRef({})
  const orderedSvgLayers = useMemo(
    () =>
      orderedLayers?.map((layer) => ODO_GRAPHS_WITH_VALID_IDS.find((svgLayer) => svgLayer.source === layer.source)).filter(Boolean) ??
      ODO_GRAPHS_WITH_VALID_IDS,
    [orderedLayers],
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
      svgElement.style.height = 'auto'
      svgElement.style.display = 'block'

      const toothElements = svgElement.querySelectorAll('[id^="tooth-"]')

      toothElements.forEach((toothElement) => {
        const toothCode = toothElement.getAttribute('id')?.replace('tooth-', '')

        if (!toothCode || !layer.toothCodes.includes(toothCode)) {
          return
        }

      const status = resolveToothDisplayStatus(
        toothCode,
        odontogramaMap,
        previewStatus?.toothCode === toothCode ? previewStatus.status : null,
      )
        const palette = SVG_STATUS_STYLE_BY_VALUE[status.value] || SVG_STATUS_STYLE_BY_VALUE.ok
        const estaSelecionado = toothCode === selectedToothCode

        toothElement.setAttribute('role', 'button')
        toothElement.setAttribute('tabindex', '0')
        toothElement.setAttribute(
          'aria-label',
          `Selecionar dente ${toothCode}. Estado atual ${status.label}. Clique para editar.`,
        )
        toothElement.style.cursor = 'pointer'
        toothElement.style.fill = palette.fill
        toothElement.style.stroke = palette.stroke
        toothElement.style.strokeWidth = estaSelecionado ? '4' : '2.4'
        toothElement.style.opacity = estaSelecionado ? '1' : '0.96'
        toothElement.style.transition = 'fill 0.2s ease, stroke 0.2s ease'
      })
    },
    [odontogramaMap, previewStatus, selectedToothCode],
  )

  useEffect(() => {
    orderedSvgLayers.forEach((layer) => {
      atualizarVisualDosDentes(layer)
    })
  }, [atualizarVisualDosDentes, orderedSvgLayers])

  const ativarDentePorTarget = useCallback(
    (target, source, event) => {
      const toothNode = target.closest('[id^="tooth-"]')

      if (!toothNode) {
        return
      }

      const toothCode = toothNode.getAttribute('id')?.replace('tooth-', '')
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

        return (
          <section key={item.source} className="space-y-2 rounded-2xl border border-black/6 bg-white p-3">
            <div className="text-sm font-semibold text-[var(--ink-700)]">
              {item.title}
              <span className="ml-2 text-[10px] text-[var(--ink-500)]">{item.label}</span>
            </div>
            <div
              ref={(element) => {
                layerRefs.current[item.source] = element
              }}
              onClick={onClickSvg}
              onKeyDown={onKeyDownSvg}
              tabIndex={-1}
              data-layer={item.source}
              className={`svg-interactive-wrap mx-auto overflow-auto ${svgConfig.wrapperClass} ${svgConfig.svgHeightClass} w-full cursor-crosshair`}
              dangerouslySetInnerHTML={{ __html: item.file }}
            />
          </section>
        )
      })}
      <p className="text-xs text-[var(--ink-500)]">
        Camada interativa ativa para permanente e decídua. O clique em cada dente atualiza o estado atual no painel.
      </p>
    </div>
  )
}

function OdontogramaPainel({
  prontuario,
  carregandoProntuario,
  selectedToothCode,
  onSelectTooth,
  preferirPermanente,
  previewStatus,
}) {
  if (carregandoProntuario) {
    return <p className="text-sm text-[var(--ink-500)]">Carregando prontuario do paciente...</p>
  }

  if (!prontuario) {
    return <p className="text-sm text-[var(--ink-500)]">Selecione um paciente para carregar o prontuario e editar.</p>
  }

  const orderedLayers =
    preferirPermanente === false
      ? [...TEETH_LAYERS].sort((layerA, layerB) => {
          if (layerA.source === 'decidua') {
            return -1
          }
          if (layerB.source === 'decidua') {
            return 1
          }
          return 0
        })
      : TEETH_LAYERS

  const previewState =
    selectedToothCode && previewStatus ? { toothCode: selectedToothCode, status: previewStatus } : null

  const missingIds = ODO_GRAPHS_WITH_VALID_IDS.flatMap((graph) =>
    graph.missingToothCodes.map((tooth) => `${graph.title}: ${tooth}`),
  )
  const useInteractiveSvg = HAS_STRUCTURED_SVG_IDS && missingIds.length === 0

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
        <p className="text-xs text-[var(--ink-500)]">
          Camada fallback por grade FDI ativa. IDs estruturais completos do SVG não foram encontrados para:
          {missingIds.length ? ` ${missingIds.join(', ')}` : ' validação dinâmica em runtime.'}
        </p>
      </div>
    )
  }

  return (
    <OdontogramaInteractiveSvg
      odontogramaMap={prontuario.odontogramaMap}
      selectedToothCode={selectedToothCode}
      onSelectTooth={onSelectTooth}
      previewStatus={previewState}
      orderedLayers={orderedLayers}
    />
  )
}

function LegendaStatus({ options }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4">
      <div className="text-sm font-semibold text-[var(--ink-900)]">Legenda</div>
      <div className="mt-2 space-y-2 text-xs">
        {options.map((status) => (
          <div key={status.value} className="flex items-center gap-2">
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

  useEffect(() => {
    selectRef.current?.focus()
  }, [])

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

  if (!isOpen || !toothSelecionado) {
    return null
  }

  const left = `${Math.max(anchorX, 12)}px`
  const top = `${Math.max(anchorY, 12)}px`

  return (
    <section
      style={{ left, top }}
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
        <label className="grid gap-2 text-sm">
          <span className="font-semibold text-[var(--ink-700)]">Novo estado</span>
          <select
            id="statusDente"
            ref={selectRef}
            value={statusSelecionado}
            onChange={onChangeStatus}
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
        <div className="flex gap-2">
          <button type="button" onClick={onSave} className="btn-primary flex-1" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" onClick={onCancel} className="rounded-2xl border border-black/12 px-4 py-2 text-sm">
            Cancelar
          </button>
        </div>
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
  const [statusError, setStatusError] = useState('')
  const [popoverAnchor, setPopoverAnchor] = useState({ x: 12, y: 12, source: null })
  const [previewStatus, setPreviewStatus] = useState(null)

  const pacientesFiltrados = useMemo(() => {
    const normalizedSearch = getSearchText(buscaPaciente)
    const numericSearch = onlyDigits(buscaPaciente)

    if (!normalizedSearch) {
      return pacientes
    }

    return pacientes.filter((paciente) => {
      const textoIndexado = [
        getSearchText(paciente.nome),
        getSearchText(paciente.cpf),
        getSearchText(paciente.telefoneWhatsapp),
        getSearchText(paciente.email),
        getSearchText(paciente.convenio),
      ]
        .filter(Boolean)
        .join(' ')

      const normalizedDigits = [
        onlyDigits(paciente.cpf),
        onlyDigits(paciente.telefoneWhatsapp),
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

    return supportedStatusByValue[prontuario.odontogramaMap[toothSelecionado]] || null
  }, [prontuario, toothSelecionado])

  const preferirDenticaoPermanente = useMemo(() => {
    if (!pacienteSelecionado) {
      return null
    }

    const isAdult = isAdultByBirthdate(pacienteSelecionado.dataNascimento)
    if (isAdult === null) {
      return null
    }

    return isAdult
  }, [pacienteSelecionado])

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

  const selecionarPaciente = useCallback(
    (novoPacienteId) => {
      setPacienteSelecionadoId(novoPacienteId)
      setFeedbackErro('')
      setFeedbackInfo('')
      setStatusError('')
      setToothSelecionado('')
      setStatusSelecionado(DEFAULT_STATUS)
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

      setStatusError('')
      setToothSelecionado(toothCode)
      setStatusSelecionado(prontuario.odontogramaMap[toothCode] || DEFAULT_STATUS)
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
    [prontuario],
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
      const data = await atualizarOdontogramaDente(prontuario.id, toothSelecionado, estadoNormalizado)
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
  }, [prontuario, statusSelecionado, toothSelecionado])

  const cancelarEdicao = useCallback(() => {
    setToothSelecionado('')
    setPreviewStatus(null)
    setStatusError('')
    setStatusSelecionado(DEFAULT_STATUS)
    setPopoverAnchor({
      x: 12,
      y: 12,
      source: null,
    })
  }, [])

  const onStatusChange = useCallback((event) => {
    const novoStatus = event.target.value
    setStatusSelecionado(novoStatus)
    setStatusError('')
    setPreviewStatus(supportedStatusByValue[novoStatus] || { value: novoStatus })
  }, [])

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
    preferirDenticaoPermanente,
    popoverAnchor,
    previewStatus,
    selecionarPaciente,
    selecionarDente,
    salvarStatus,
    salvarStatusComFechamento,
    onStatusChange,
    cancelarEdicao,
  }
}

export default function Prontuario() {
  const { user, logout } = useAuth()

  const {
    buscaPaciente,
    setBuscaPaciente,
    pacientesFiltrados,
    carregandoPacientes,
    pacienteSelecionadoId,
    carregandoProntuario,
    feedbackErro,
    feedbackInfo,
    prontuario,
    toothSelecionado,
    statusSelecionado,
    statusError,
    selecionarPaciente,
    selecionarDente,
    salvarStatusComFechamento,
    pacienteSelecionado,
    opcaoSelecionada,
    carregandoAtualizacao,
    preferirDenticaoPermanente,
    popoverAnchor,
    previewStatus,
    onStatusChange,
    cancelarEdicao,
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

            <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
              <div className="input-shell">
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
                  onChange={(event) => setBuscaPaciente(event.target.value)}
                  placeholder="Busque por nome, CPF ou telefone"
                  aria-label="Buscar paciente"
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-500)]"
                />
              </div>

              {buscaPaciente &&
                pacientesFiltrados.length > 0 &&
                pacientesFiltrados.length <= QUICK_PATIENT_SELECTION_LIMIT && (
                  <div className="flex flex-wrap gap-2">
                    {pacientesFiltrados.map((paciente) => (
                      <button
                        key={paciente.id}
                        type="button"
                        onClick={() => selecionarPaciente(paciente.id)}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-[var(--ink-800)]"
                        aria-label={`Selecionar paciente ${paciente.nome}`}
                      >
                        {paciente.nome}
                      </button>
                    ))}
                  </div>
                )}

              <label className="grid gap-2 text-sm" htmlFor="filtroPaciente">
                <span className="font-semibold text-[var(--ink-700)]">Paciente</span>
                <select
                  id="filtroPaciente"
                  value={pacienteSelecionadoId}
                  onChange={(event) => selecionarPaciente(event.target.value)}
                  className="rounded-2xl border border-black/8 px-3 py-3 text-sm outline-none"
                  disabled={carregandoPacientes}
                  aria-label="Selecionar paciente"
                >
                  <option value="">Selecione um paciente</option>
                  {pacientesFiltrados.map((paciente) => (
                    <option key={paciente.id} value={paciente.id}>
                      {paciente.nome}
                    </option>
                  ))}
                </select>
              </label>
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
                  preferirPermanente={preferirDenticaoPermanente}
                  previewStatus={previewStatus}
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
