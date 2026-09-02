# Arquitetura — Sistema de Gestão para The Prevention Therapy Center

## 1. Visão geral

Substituir o caderno físico de agenda por um sistema que mantenha a mesma
fluidez de uso (buscar paciente → escolher horário → agendar → marcar
presença → registrar pagamento) e automatize tudo o que hoje é feito à mão:
bloqueios, turnos fixos, histórico, pendências de pagamento, reemplazos,
lista de espera, cálculo de taxas e liquidação diária.

**Princípio central do sistema (item 23 da especificação):** toda regra
permanente (horário de trabalho, paciente fixo) deve poder ter **exceções
pontuais por data**, sem que a exceção destrua a configuração permanente.
Isso aparece em pelo menos três lugares — pacientes fixos, escala de
profissionais e reemplazos — e por isso vira um padrão reutilizável no
modelo de dados (ver seção 4.3).

## 2. Stack técnica

| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend | React (Vite) | Você já trabalha com React; dashboard denso se beneficia de SPA |
| Backend/DB | Firebase (Firestore) | Evita subir servidor próprio; Firestore lida bem com documentos por sessão/dia; regras de segurança por usuário |
| Auth | Firebase Auth | Login de secretária/admin com papéis (role) |
| Hospedagem | Vercel (frontend) + Firebase (dados) | Já é ferramenta do seu stack |
| Cálculos de liquidação | Cloud Function (Firebase Functions) ou cálculo no client + gravação do snapshot final | Ver seção 6 — decisão importante |

Não é necessário Node/Express separado: Firestore + Cloud Functions cobre o
backend. Isso simplifica o deploy.

## 3. Módulos (mapeados 1:1 com a seção 24 do PDF)

1. **Agenda** — grade diária por profissional/sala, com criação/edição de
   sessão, presença e bloqueios visíveis na mesma tela.
2. **Pacientes** — ficha permanente + histórico.
3. **Pacientes fixos** — regra recorrente + exceções.
4. **Reemplazos** — profissional substituto por dia específico.
5. **Bloqueios** — horários indisponíveis de um profissional num dia.
6. **Histórico** — consulta de sessões passadas (nunca apagadas).
7. **Pagamentos** — registrados dentro da sessão.
8. **Lista de espera** — preferências sem reserva de horário.
9. **Liquidação diária** — cálculo automático + fechamento.

## 4. Modelo de dados (Firestore)

Firestore é orientado a documentos; a modelagem abaixo evita relações
complexas demais, priorizando **uma coleção "sessions" como fonte de
verdade do dia**, já que é o que a especificação pede explicitamente
(histórico completo, mesmo de cancelamentos e faltas).

### 4.1 `professionals`
```
professionals/{professionalId}
  name: string
  active: boolean
  defaultSchedule: {            // horário habitual, por dia da semana
    mon: { start: "07:00", end: "17:00", room: "Sala 1" } | null,
    tue: {...} | null,
    ...
  }
  sessionRate: number           // valor cobrado por sessão do profissional
  roomCost: number              // custo de sala do dia (pode ser fixo por dia trabalhado)
  perSessionFee: number         // taxa por sessão (ex: 2500 Gs)
```

### 4.2 `scheduleExceptions` (exceção pontual à escala do profissional)
```
scheduleExceptions/{id}
  professionalId: string
  date: "2026-08-31"
  type: "absent" | "custom_hours" | "extra_day"
  customSchedule?: { start, end, room }
  reason?: string
  replacementProfessionalId?: string   // quem substitui, se houver
```
Isso resolve o item 11 (reemplazo de profissionais): a escala habitual
(4.1) não é tocada; só se registra a exceção do dia.

### 4.3 `blocks` (bloqueio manual de horário — item 5)
```
blocks/{id}
  professionalId: string
  date: "2026-08-25"
  startTime: "12:00"
  endTime: "12:30"
  reason?: string   // "Almuerzo", "Retiro 17:00", etc.
```

### 4.4 `patients`
```
patients/{patientId}
  fullName: string
  phone: string
  billingProfiles: [
    { id, name, ruc, isDefault }   // pode ter mais de um (item 13)
  ]
  notes?: string
```

### 4.5 `recurringRules` (paciente fixo — item 9 e 10)
```
recurringRules/{id}
  patientId: string
  weekday: "mon"
  time: "08:00"
  professionalId: string
  billingProfileId: string
  active: boolean
  startDate: "2026-06-01"
  endDate: "2026-12-01" | null      // preenchido quando o paciente para de vir
  exceptions: [                     // não gera sessão nesse dia, ou gera diferente
    {
      date: "2026-08-31",
      action: "reassign" | "cancel" | "reschedule",
      newProfessionalId?: string,
      newTime?: string,
      note?: string
    }
  ]
```
A geração de sessões futuras a partir daqui é feita por uma Cloud
Function agendada (ex: gerar a próxima semana toda noite), aplicando as
exceções automaticamente.

### 4.6 `sessions` (coração do sistema — histórico nunca é apagado)
```
sessions/{sessionId}
  date: "2026-08-25"
  startTime: "08:00"
  durationMinutes: 60             // permite sessões de 60 ou 120 min (item 18)
  professionalId: string
  scheduledProfessionalId?: string  // profissional "original" se houve reemplazo (item 11)
  roomId: string
  patientId: string | null        // null = horário disponível
  billingProfileId?: string
  recurringRuleId?: string        // se veio de um paciente fixo
  status: "disponible" | "asistio" | "cancelo_aviso" | "no_asistio_sin_aviso"
  payment?: {
    method: "efectivo" | "transferencia" | "cheque" | "pendiente"
    amount: number
    paidAt?: timestamp
  }
  createdAt, updatedAt: timestamp
```
**Regra de conflito:** ao criar/mover uma sessão, validar que não existe
outra sessão do mesmo `professionalId`/`date` cujo intervalo
`[startTime, startTime+duration)` se sobreponha, e que o intervalo não
caia dentro de um `block`.

### 4.7 `waitlist` (lista de espera — item 21/22)
```
waitlist/{id}
  patientId: string
  preferredTime: "tarde" | "mañana" | "cualquiera"
  preferredProfessionalId?: string
  preferredDays?: string[]
  observation?: string
  createdAt: timestamp
  status: "esperando" | "convertido" | "descartado"
```
Quando uma sessão vira `disponible` (cancelamento avisado), a UI pode
sugerir entradas da waitlist compatíveis por profissional/período.

### 4.8 `dailySettlements` (liquidação — item 17–20)
```
dailySettlements/{professionalId_date}
  professionalId: string
  date: "2026-08-25"
  sessionsCount: number        // já convertido em "unidades de 1h" (item 18)
  grossAmount: number          // sessionsCount * sessionRate
  roomCost: number
  feesTotal: number            // sessionsCount * perSessionFee
  adjustments: [
    { concept: "Almuerzo", amount: 35000 }
  ]
  netAmount: number            // gross - room - fees - sum(adjustments)
  closedAt: timestamp | null   // null = ainda editável, preenchido = fechada
```

## 5. Regras de negócio centrais

### 5.1 Geração de sessões a partir de paciente fixo
Job diário (Cloud Function agendada) que, para os próximos N dias:
1. Para cada `recurringRule` ativa cujo `weekday` bate com a data,
2. verifica se já existe `session` com aquele `recurringRuleId` para a data,
3. se não existir, verifica `exceptions` da regra para aquela data,
4. cria a `session` com o profissional/horário correto (original ou
   exceção), respeitando `blocks` e conflitos existentes.

### 5.2 Cálculo de "sessões" para taxa (item 18)
Não contar por paciente, e sim por blocos de 60 min:
```
unidades = soma(durationMinutes de cada session com status="asistio") / 60
```
Uma sessão de 120 min conta como 2 unidades tanto para o valor bruto
quanto para a taxa por sessão.

### 5.3 Liquidação diária
```
grossAmount = unidades * professional.sessionRate
feesTotal   = unidades * professional.perSessionFee
netAmount   = grossAmount - roomCost - feesTotal - soma(adjustments.amount)
```
Gerada automaticamente ao abrir a tela de liquidação do dia (soma das
`sessions` com `status="asistio"`), mas só é gravada como "fechada"
(`closedAt` preenchido) quando a secretária confirmar — antes disso pode
mudar se algum status de presença for corrigido.

### 5.4 Separação sessão realizada × pagamento recebido (item 16)
`session.status = "asistio"` conta para a liquidação **independente** de
`payment.method` ser `"pendiente"`. O valor pendente fica visível na
ficha do paciente até ser marcado como pago.

## 6. Onde calcular: client vs Cloud Function

Recomendo:
- **Leitura/preview em tempo real** (tela de liquidação): calculado no
  client a partir das `sessions` do dia — simples, reativo.
- **Fechamento oficial**: uma Cloud Function que recalcula do zero a
  partir de `sessions` (não confia no que o client mandou), grava em
  `dailySettlements` e marca `closedAt`. Evita divergência se dois
  dispositivos estiverem abertos ao mesmo tempo.

## 7. Estrutura de pastas sugerida (frontend)

```
src/
  modules/
    agenda/        # grid diário, criação/edição de sessão
    patients/       # ficha, histórico, billing profiles
    recurring/       # pacientes fixos + exceções
    replacements/     # reemplazo de profissionais
    blocks/
    waitlist/
    settlement/       # liquidação diária
  shared/
    components/
    hooks/            # useSessions(date), useProfessionals(date), etc.
    firebase/
  types/
```

## 8. Roadmap sugerido

| Fase | Entregável |
|---|---|
| 1 | Modelo de dados no Firestore + regras de segurança + CRUD de profissionais/pacientes |
| 2 | Tela de Agenda (grid do dia, criar sessão, marcar presença, bloqueios) |
| 3 | Pagamentos + histórico do paciente |
| 4 | Pacientes fixos com geração automática + exceções |
| 5 | Reemplazos de profissionais |
| 6 | Lista de espera |
| 7 | Liquidação diária (preview + fechamento) |

Isso segue a mesma ordem de prioridade da especificação (item 25): o
fluxo cotidiano da secretária primeiro, automações por trás depois.

## 9. Pontos em aberto para decidir antes da Fase 1

- Quantas salas/profissionais simultâneos configurar por padrão (PDF
  cita 8 no geral, 9 às quartas) — deve ser configurável por dia da
  semana, não fixo no código.
- Regras de acesso: só a secretária usa o sistema, ou os profissionais
  também terão login para ver sua própria agenda/liquidação?
- Impressão (o header da referência tem botão "Imprimir") — gerar PDF do
  dia ou só impressão do navegador?
