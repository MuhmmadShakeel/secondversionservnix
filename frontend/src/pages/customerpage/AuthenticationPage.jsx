import Login from '../../components/authentication/Login'
import Signup from '../../components/authentication/Signup'
import PasswordRecovery from '../../components/authentication/PasswordRecovery.jsx'

export default function AuthenticationPage({ mode, onBack, onLogin, onSignup, onForgotPassword, onAuthenticated }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ffe8f1,_transparent_38%),linear-gradient(135deg,_#fffafb,_#f8f3f5)] px-5 py-7 sm:px-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <button className="flex items-center gap-2 text-xl font-bold" type="button" onClick={onBack}>
          <span className="grid size-8 place-items-center rounded-xl bg-[#dd3f7d] font-display italic text-white">S</span>
          servnix
        </button>
        <button className="text-sm font-medium text-[#6d4b5b] transition hover:text-[#cc326e]" type="button" onClick={onBack}>
          Back to home
        </button>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-88px)] max-w-md items-center py-10">
        {mode === 'forgot' || mode === 'reset' ? <PasswordRecovery key={mode} onLogin={onLogin} /> : mode === 'signup' ? (
          <Signup onLogin={onLogin} onAuthenticated={onAuthenticated} />
        ) : (
          <Login onSignup={onSignup} onForgotPassword={onForgotPassword} onAuthenticated={onAuthenticated} />
        )}
      </div>
    </main>
  )
}
