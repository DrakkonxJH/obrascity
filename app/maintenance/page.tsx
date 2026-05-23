export default function MaintenancePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center px-4">
        <div className="mb-6">
          <svg className="w-24 h-24 mx-auto text-yellow-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Manutenção em Andamento</h1>
        <p className="text-gray-300 text-lg mb-6">Estamos atualizando o site para você.</p>
        <p className="text-gray-400">Por favor, tente novamente em alguns instantes.</p>
      </div>
    </div>
  );
}
