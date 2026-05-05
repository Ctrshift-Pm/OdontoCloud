import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import { useAuth } from '../hooks/useAuth'
import Agenda from '../pages/Agenda'
import Login from '../pages/Login'
import ModulePlaceholder from '../pages/ModulePlaceholder'
import Pacientes from '../pages/Pacientes'
import Prontuario from '../pages/Prontuario'
import Financeiro from '../pages/Financeiro'

function HomeRedirect() {
  const { isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<ModulePlaceholder title="Dashboard" subtitle="Visao executiva da clinica em preparacao." />}
          />
          <Route path="/agenda" element={<Agenda />} />
          <Route
            path="/ia-atendimento"
            element={<ModulePlaceholder title="IA Atendimento" subtitle="Fluxos assistidos por IA serao conectados nesta area." />}
          />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/prontuario" element={<Prontuario />} />
          <Route
            path="/assinatura-digital"
            element={<ModulePlaceholder title="Assinatura Digital" subtitle="Assinaturas e documentos serao centralizados aqui." />}
          />
          <Route
            path="/financeiro"
            element={<Financeiro />}
          />
          <Route
            path="/configuracoes"
            element={<ModulePlaceholder title="Configuracoes" subtitle="Preferencias da clinica e regras operacionais serao gerenciadas aqui." />}
          />
        </Route>
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
