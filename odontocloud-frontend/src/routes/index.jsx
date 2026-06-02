import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import { useAuth } from '../hooks/useAuth'
import Agenda from '../pages/Agenda'
import Login from '../pages/Login'
import ModulePlaceholder from '../pages/ModulePlaceholder'
import Dashboard from '../pages/Dashboard'
import Pacientes from '../pages/Pacientes'
import Prontuario from '../pages/Prontuario'
import Financeiro from '../pages/Financeiro'
import Perfil from '../pages/Perfil'
import Configuracoes from '../pages/Configuracoes'
import IaAtendimento from '../pages/IaAtendimento'

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
            element={<Dashboard />}
          />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/ia-atendimento" element={<IaAtendimento />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/prontuario" element={<Prontuario />} />
          <Route
            path="/assinatura-digital"
            element={<ModulePlaceholder title="Assinatura Digital" subtitle="Módulo em breve. A navegação está disponível, mas não há transações ativas." />}
          />
          <Route
            path="/financeiro"
            element={<Financeiro />}
          />
          <Route path="/perfil" element={<Perfil />} />
          <Route
            path="/configuracoes"
            element={<Configuracoes />}
          />
        </Route>
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
