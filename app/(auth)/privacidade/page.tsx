import Link from "next/link";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export default function PrivacidadePage() {
  return (
    <LegalPageShell
      title="Política de Privacidade"
      subtitle="Última atualização: 26 de maio de 2026 · Versão 3.0 · Adequada à LGPD (Lei nº 13.709/2018) · Leitura estimada: 30 minutos"
    >
      <div className="highlight-box">
        <strong>🔒 Sua privacidade é levada muito a sério aqui.</strong><br />
        Esta Política de Privacidade explica, em linguagem clara e acessível, absolutamente tudo
        sobre como o ObrasFlow trata seus dados pessoais: o que coletamos, por que coletamos, como
        usamos, com quem compartilhamos (e com quem NÃO compartilhamos), por quanto tempo
        guardamos e quais são os seus direitos.<br /><br />
        Não usamos linguagem jurídica desnecessariamente complicada para esconder nada. Acreditamos
        que você tem o direito de entender exatamente o que acontece com seus dados.
      </div>

      {/* 1 */}
      <h2><span className="num">1</span> Quem Somos — Identificação do Controlador e do Operador</h2>
      <p>
        Para entender esta Política, é importante saber a diferença entre dois papéis previstos na
        LGPD (Lei Geral de Proteção de Dados Pessoais):
      </p>
      <ul>
        <li>
          <strong>Controlador:</strong> A pessoa ou empresa que decide <em>por que</em> e <em>como</em>
          os dados são tratados. O controlador define as finalidades do tratamento.
        </li>
        <li>
          <strong>Operador:</strong> A pessoa ou empresa que trata dados em nome do controlador,
          seguindo as instruções dele.
        </li>
      </ul>
      <p>
        No contexto do ObrasFlow, os papéis funcionam assim:
      </p>
      <ul>
        <li>
          <strong>Para os dados dos próprios usuários da plataforma</strong> (nome, e-mail,
          informações de conta, dados de uso): o <strong>ObrasFlow é o Controlador</strong>.
          Somos nós quem decidimos como esses dados são tratados para fornecer o serviço;
        </li>
        <li>
          <strong>Para os dados de terceiros que os clientes inserem na plataforma</strong>
          (dados de funcionários, clientes finais, fornecedores): o <strong>cliente (empresa
          usuária) é o Controlador</strong> e o <strong>ObrasFlow atua como Operador</strong>,
          tratando esses dados conforme as instruções do cliente para fornecer o serviço contratado.
        </li>
      </ul>
      <div className="info-box">
        <strong>Encarregado de Dados (DPO):</strong><br />
        O ObrasFlow designou um Encarregado pelo Tratamento de Dados Pessoais (Data Protection
        Officer — DPO), responsável por receber comunicações dos titulares de dados e das
        autoridades, e por garantir a conformidade com a LGPD.<br /><br />
        Para contato com o DPO: acesse Configurações → Segurança e LGPD → Contatar DPO, ou
        utilize o canal de suporte da plataforma com o assunto "Privacidade — DPO".
      </div>

      {/* 2 */}
      <h2><span className="num">2</span> Quais Dados Coletamos — Tudo Detalhado</h2>
      <p>
        Coletamos apenas os dados necessários para fornecer o serviço e cumprir obrigações legais.
        Abaixo, detalhamos cada categoria de dado que coletamos, quando e como:
      </p>
      <h3>2.1 Dados que Você Nos Fornece Diretamente</h3>
      <p>
        São os dados que você mesmo insere na plataforma, seja durante o cadastro ou durante o uso:
      </p>
      <table>
        <thead>
          <tr><th>Categoria</th><th>Dados específicos</th><th>Quando é coletado</th><th>Por que precisamos</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Identificação pessoal</strong></td>
            <td>Nome completo, e-mail, telefone (opcional), foto de perfil (opcional)</td>
            <td>No cadastro e na edição do perfil</td>
            <td>Para identificar o usuário e permitir o acesso à conta</td>
          </tr>
          <tr>
            <td><strong>Dados da empresa</strong></td>
            <td>Razão social, nome fantasia, CNPJ (opcional), endereço, cidade, estado, setor de atuação, porte da empresa</td>
            <td>Na configuração inicial da conta</td>
            <td>Para personalizar a experiência e para emissão de faturas</td>
          </tr>
          <tr>
            <td><strong>Credenciais de acesso</strong></td>
            <td>Senha (armazenada com hash bcrypt — nunca em texto claro; nem nós temos acesso)</td>
            <td>No cadastro e nas alterações de senha</td>
            <td>Para autenticar o acesso à conta com segurança</td>
          </tr>
          <tr>
            <td><strong>Dados de pagamento</strong></td>
            <td>Nome no cartão, últimos 4 dígitos, bandeira (armazenados pelo Stripe, não pelo ObrasFlow), endereço de cobrança</td>
            <td>Na contratação de plano pago</td>
            <td>Para processar pagamentos e emitir faturas</td>
          </tr>
          <tr>
            <td><strong>Conteúdo operacional</strong></td>
            <td>Dados de obras, projetos, cronogramas, diários, fotos, plantas, documentos, medições, orçamentos, contratos, relatórios</td>
            <td>Durante o uso dos módulos da plataforma</td>
            <td>Para fornecer as funcionalidades de gestão de obras</td>
          </tr>
          <tr>
            <td><strong>Comunicações com suporte</strong></td>
            <td>Mensagens, e-mails, feedbacks, solicitações e qualquer comunicação enviada ao suporte</td>
            <td>Ao entrar em contato com o suporte</td>
            <td>Para resolver problemas, melhorar o serviço e manter histórico de atendimento</td>
          </tr>
          <tr>
            <td><strong>Dados de terceiros inseridos pelo cliente</strong></td>
            <td>Nome, CPF, telefone, cargo, função, dados de contato de funcionários, clientes finais, fornecedores e parceiros</td>
            <td>Ao usar módulos de equipe, CRM, contratos e fornecedores</td>
            <td>Para fornecer as funcionalidades de gestão de pessoas e relacionamentos</td>
          </tr>
        </tbody>
      </table>

      <h3>2.2 Dados Coletados Automaticamente pelo Sistema</h3>
      <p>
        Quando você usa a plataforma, alguns dados são coletados automaticamente pelos sistemas
        de forma técnica, sem que você precise inserir nada:
      </p>
      <table>
        <thead>
          <tr><th>Categoria</th><th>Dados específicos</th><th>Por que coletamos</th><th>Por quanto tempo</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Dados de acesso</strong></td>
            <td>Endereço IP, data e hora do acesso, navegador utilizado, versão do navegador, sistema operacional, resolução de tela, idioma do navegador</td>
            <td>Segurança, detecção de acessos suspeitos e diagnóstico técnico</td>
            <td>6 meses (obrigação legal — Marco Civil, art. 15)</td>
          </tr>
          <tr>
            <td><strong>Logs de uso</strong></td>
            <td>Páginas acessadas, funcionalidades utilizadas, botões clicados, tempo de permanência em cada sessão, fluxo de navegação</td>
            <td>Melhoria da experiência do usuário e desenvolvimento de novas funcionalidades</td>
            <td>12 meses</td>
          </tr>
          <tr>
            <td><strong>Logs de operações críticas</strong></td>
            <td>Registros de login/logout, tentativas de login falhas, exclusão de dados, exportação de dados, alterações de configuração importantes</td>
            <td>Auditoria, segurança e investigação de incidentes</td>
            <td>12 meses</td>
          </tr>
          <tr>
            <td><strong>Dados de dispositivo</strong></td>
            <td>Tipo de dispositivo (desktop, tablet, celular), identificadores técnicos do dispositivo para fins de sessão</td>
            <td>Segurança (detecção de novos dispositivos) e otimização da interface</td>
            <td>Enquanto durar a sessão</td>
          </tr>
          <tr>
            <td><strong>Localização aproximada</strong></td>
            <td>País, estado e cidade aproximados, derivados do endereço IP (não usamos GPS)</td>
            <td>Segurança (alerta de acesso de localização incomum) e conformidade regulatória</td>
            <td>6 meses</td>
          </tr>
          <tr>
            <td><strong>Cookies</strong></td>
            <td>Ver Seção 6 — detalhes completos sobre cookies</td>
            <td>Manutenção de sessão, preferências e análise de uso</td>
            <td>Varia por tipo de cookie</td>
          </tr>
        </tbody>
      </table>

      <h3>2.3 O Que NÃO Coletamos</h3>
      <p>
        Para ser completamente transparente, também listamos o que <strong>não</strong> coletamos:
      </p>
      <ul>
        <li>❌ Dados biométricos (impressão digital, reconhecimento facial, voz);</li>
        <li>❌ Dados de saúde, condição médica ou histórico médico;</li>
        <li>❌ Dados de origem racial ou étnica;</li>
        <li>❌ Opiniões políticas, crenças religiosas ou filosóficas;</li>
        <li>❌ Orientação sexual ou vida íntima;</li>
        <li>❌ Número completo do cartão de crédito ou CVV (processados exclusivamente pelo Stripe);</li>
        <li>❌ Senhas em texto claro (somente hash irreversível é armazenado);</li>
        <li>❌ Conteúdo de conversas privadas fora da plataforma;</li>
        <li>❌ Dados de redes sociais sem sua autorização explícita.</li>
      </ul>

      {/* 3 */}
      <h2><span className="num">3</span> Por Que Usamos Seus Dados — Finalidades Detalhadas</h2>
      <p>
        Cada dado que coletamos tem uma finalidade específica, legítima e proporcional. Não
        utilizamos seus dados de forma incompatível com as finalidades informadas abaixo. Para
        cada finalidade, indicamos também a base legal que a justifica na LGPD:
      </p>
      <table>
        <thead>
          <tr><th>Finalidade</th><th>Descrição detalhada</th><th>Dados utilizados</th><th>Base legal (LGPD)</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Criar e gerenciar sua conta</strong></td>
            <td>Processar o cadastro, autenticar logins, manter o perfil ativo, gerenciar permissões de acesso dos membros da equipe</td>
            <td>Nome, e-mail, senha, dados da empresa</td>
            <td>Execução de contrato (art. 7º, V)</td>
          </tr>
          <tr>
            <td><strong>Fornecer as funcionalidades da plataforma</strong></td>
            <td>Processar, armazenar e exibir todos os dados operacionais inseridos (obras, projetos, diários, relatórios, etc.) para você e sua equipe</td>
            <td>Conteúdo operacional, dados de equipe</td>
            <td>Execução de contrato (art. 7º, V)</td>
          </tr>
          <tr>
            <td><strong>Processar pagamentos e gerenciar assinatura</strong></td>
            <td>Cobrar pelo plano contratado, renovar assinaturas, emitir faturas, gerenciar upgrade/downgrade, processar reembolsos</td>
            <td>Dados de cobrança, dados da empresa</td>
            <td>Execução de contrato (art. 7º, V)</td>
          </tr>
          <tr>
            <td><strong>Prestar suporte ao usuário</strong></td>
            <td>Responder dúvidas e solicitações, diagnosticar e corrigir problemas, oferecer orientações de uso, registrar histórico de atendimento</td>
            <td>Dados da conta, logs, comunicações com suporte</td>
            <td>Execução de contrato (art. 7º, V)</td>
          </tr>
          <tr>
            <td><strong>Garantir a segurança da plataforma</strong></td>
            <td>Detectar e prevenir acessos não autorizados, identificar comportamentos suspeitos, investigar incidentes de segurança, proteger os dados de todos os usuários</td>
            <td>Logs de acesso, IP, dados de dispositivo</td>
            <td>Legítimo interesse (art. 7º, IX)</td>
          </tr>
          <tr>
            <td><strong>Cumprir obrigações legais</strong></td>
            <td>Manter registros fiscais e contábeis exigidos por lei, responder a requisições de autoridades competentes (Receita Federal, Ministério Público, etc.)</td>
            <td>Dados de cobrança, logs, dados da empresa</td>
            <td>Obrigação legal (art. 7º, II)</td>
          </tr>
          <tr>
            <td><strong>Melhorar a plataforma</strong></td>
            <td>Analisar padrões de uso de forma <em>agregada e anonimizada</em> para identificar funcionalidades mais usadas, gargalos de usabilidade e oportunidades de melhoria</td>
            <td>Logs de uso (anonimizados)</td>
            <td>Legítimo interesse (art. 7º, IX)</td>
          </tr>
          <tr>
            <td><strong>Comunicações essenciais</strong></td>
            <td>Enviar notificações obrigatórias: faturas, alertas de vencimento, avisos de segurança, comunicados sobre alterações nos Termos, avisos de manutenção</td>
            <td>E-mail, nome</td>
            <td>Execução de contrato / Obrigação legal</td>
          </tr>
          <tr>
            <td><strong>Comunicações de marketing</strong></td>
            <td>Enviar novidades sobre novas funcionalidades, dicas de uso, promoções e conteúdo educacional sobre gestão de obras — apenas para usuários que consentiram expressamente</td>
            <td>E-mail, nome, dados de uso (preferências)</td>
            <td>Consentimento (art. 7º, I)</td>
          </tr>
          <tr>
            <td><strong>Exercício de direitos legais</strong></td>
            <td>Usar dados como evidência em processos judiciais, administrativos ou arbitrais nos quais o ObrasFlow seja parte</td>
            <td>Logs, dados da conta, comunicações</td>
            <td>Exercício regular de direitos (art. 7º, VI)</td>
          </tr>
        </tbody>
      </table>
      <div className="highlight-box">
        <strong>🚫 O que nunca fazemos com seus dados:</strong><br />
        Não vendemos seus dados. Não alugamos. Não cedemos para empresas de marketing. Não usamos
        para publicidade de terceiros. Não cruzamos seus dados com os de outras empresas clientes
        do ObrasFlow. Jamais.
      </div>

      {/* 4 */}
      <h2><span className="num">4</span> Bases Legais — Por Que Temos o Direito de Tratar Seus Dados</h2>
      <p>
        A LGPD exige que todo tratamento de dados pessoais tenha uma justificativa legal — chamada
        de "base legal". Não basta querer tratar dados; é preciso ter um motivo legítimo previsto
        em lei. Abaixo explicamos cada base legal que utilizamos e o que ela significa na prática:
      </p>
      <ul>
        <li>
          <strong>Execução de contrato (art. 7º, V da LGPD):</strong> Utilizamos seus dados porque
          é necessário para cumprir o contrato que temos com você (os Termos de Uso). Sem esses
          dados, simplesmente não conseguimos fornecer o serviço. Exemplo: sem seu e-mail, não
          conseguimos criar sua conta; sem os dados das obras, não conseguimos fornecer o módulo
          de gestão de projetos.
        </li>
        <li>
          <strong>Cumprimento de obrigação legal (art. 7º, II da LGPD):</strong> Em alguns casos,
          a lei nos obriga a manter determinados dados. Exemplo: o Marco Civil da Internet (art. 15)
          nos obriga a guardar logs de acesso por 6 meses; leis fiscais nos obrigam a manter
          registros de cobrança por 5 anos.
        </li>
        <li>
          <strong>Legítimo interesse (art. 7º, IX da LGPD):</strong> Para finalidades onde temos
          um interesse legítimo que não se sobrepõe aos seus direitos. Exemplo: analisar logs de
          acesso para detectar tentativas de invasão (nosso interesse e o seu coincidem — ninguém
          quer ter a conta invadida). Antes de usar essa base legal, realizamos uma análise de
          proporcionalidade para garantir que o interesse do ObrasFlow não prejudique
          desnecessariamente os direitos do titular.
        </li>
        <li>
          <strong>Consentimento (art. 7º, I da LGPD):</strong> Para tratamentos opcionais, como
          envio de e-mails de marketing, pedimos seu consentimento explícito. Você pode revogar
          esse consentimento a qualquer momento, sem nenhum prejuízo ao uso da plataforma.
          A revogação do consentimento não afeta o tratamento realizado antes dela.
        </li>
        <li>
          <strong>Exercício regular de direitos (art. 7º, VI da LGPD):</strong> Para usar dados
          em processos judiciais, administrativos ou arbitrais como meio de prova ou defesa.
        </li>
        <li>
          <strong>Proteção da vida (art. 7º, III da LGPD):</strong> Em situações extremamente
          excepcionais envolvendo risco iminente à vida ou à segurança de pessoas — situação que
          esperamos nunca ocorrer no contexto do ObrasFlow.
        </li>
      </ul>

      {/* 5 */}
      <h2><span className="num">5</span> Com Quem Compartilhamos Seus Dados</h2>
      <p>
        Esta é uma das partes mais importantes desta Política. Explicamos aqui, de forma
        completamente transparente, todos os cenários em que seus dados podem ser acessados
        por outros além de você:
      </p>
      <h3>5.1 Nossa Equipe Interna</h3>
      <p>
        Funcionários e colaboradores do ObrasFlow têm acesso apenas aos dados estritamente
        necessários para desempenhar suas funções (princípio do menor privilégio). Por exemplo:
        a equipe de suporte pode acessar dados da conta para resolver um problema; a equipe técnica
        acessa logs para investigar um bug. Nenhum funcionário acessa dados de clientes por
        curiosidade ou para fins pessoais — isso é expressamente proibido por nossas políticas
        internas e pelos contratos de trabalho.
      </p>
      <h3>5.2 Prestadores de Serviço Técnico (Suboperadores)</h3>
      <p>
        Para fornecer o serviço, precisamos de parceiros técnicos especializados. Esses parceiros
        atuam como "suboperadores" — ou seja, tratam dados em nosso nome e seguindo nossas
        instruções. Todos eles estão sujeitos a contratos que exigem proteção de dados equivalente
        à desta Política:
      </p>
      <table>
        <thead>
          <tr><th>Parceiro</th><th>Serviço</th><th>Dados compartilhados</th><th>País</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Stripe</strong></td>
            <td>Processamento de pagamentos</td>
            <td>Dados de cobrança (os dados do cartão ficam exclusivamente no Stripe, certificado PCI-DSS nível 1)</td>
            <td>EUA (com adequação LGPD)</td>
          </tr>
          <tr>
            <td><strong>Provedor de hospedagem em nuvem</strong></td>
            <td>Armazenamento e processamento de dados</td>
            <td>Todos os dados da plataforma (armazenados de forma criptografada)</td>
            <td>Brasil / EUA</td>
          </tr>
          <tr>
            <td><strong>Serviço de e-mail transacional</strong></td>
            <td>Envio de notificações, faturas e comunicações</td>
            <td>Nome e e-mail do destinatário</td>
            <td>Brasil / EUA</td>
          </tr>
          <tr>
            <td><strong>Serviço de monitoramento de erros</strong></td>
            <td>Detecção e diagnóstico de erros técnicos</td>
            <td>Logs técnicos (anonimizados na medida do possível)</td>
            <td>EUA (com adequação LGPD)</td>
          </tr>
        </tbody>
      </table>
      <h3>5.3 Autoridades Governamentais e Obrigações Legais</h3>
      <p>
        Podemos compartilhar dados com autoridades quando:
      </p>
      <ul>
        <li>
          <strong>Formos legalmente obrigados:</strong> Requisição judicial com mandado legal válido,
          ordem do Ministério Público, requisição da Receita Federal com base em lei, etc. Não
          fornecemos dados com base em pedidos informais ou sem respaldo legal adequado;
        </li>
        <li>
          <strong>Para defender nossos direitos:</strong> Em processos judiciais ou administrativos
          nos quais o ObrasFlow seja parte, podemos usar dados como meio de prova;
        </li>
        <li>
          <strong>Para proteger direitos de terceiros:</strong> Em casos de fraude comprovada ou
          atividade criminosa que afete outros usuários ou terceiros.
        </li>
      </ul>
      <p>
        <strong>Quando possível e permitido por lei</strong>, notificaremos o Usuário antes de
        fornecer dados a autoridades, para que ele possa buscar medidas legais caso entenda que
        o pedido é indevido.
      </p>
      <h3>5.4 Em Caso de Venda ou Reestruturação do ObrasFlow</h3>
      <p>
        Se o ObrasFlow for adquirido, se fundir com outra empresa ou vender parte de seus ativos,
        os dados dos usuários podem ser transferidos ao novo controlador. Nesse caso:
      </p>
      <ul>
        <li>Notificaremos todos os usuários com antecedência razoável;</li>
        <li>O novo controlador será obrigado a manter proteções equivalentes às desta Política;</li>
        <li>Se as práticas de privacidade do novo controlador forem menos protetoras, você terá o direito de encerrar sua conta sem ônus antes da transferência.</li>
      </ul>
      <h3>5.5 O Que Definitivamente NÃO Fazemos</h3>
      <ul>
        <li>🚫 Não vendemos dados a terceiros, jamais;</li>
        <li>🚫 Não compartilhamos dados para fins de publicidade de terceiros;</li>
        <li>🚫 Não permitimos que anunciantes ou corretores de dados acessem informações dos usuários;</li>
        <li>🚫 Não cruzamos dados de um cliente com dados de outro cliente;</li>
        <li>🚫 Não compartilhamos dados com concorrentes ou parceiros comerciais sem relação técnica direta;</li>
        <li>🚫 Não fornecemos dados a autoridades sem respaldo legal adequado.</li>
      </ul>

      {/* 6 */}
      <h2><span className="num">6</span> Cookies — O Que São, Quais Usamos e Como Gerenciar</h2>
      <h3>6.1 O Que São Cookies?</h3>
      <p>
        Cookies são pequenos arquivos de texto que os sites armazenam no seu navegador quando você
        os acessa. Eles servem para que o site "lembre" de você entre visitas ou durante uma sessão.
        Cookies <strong>não são vírus</strong>, <strong>não executam código</strong> e{" "}
        <strong>não têm acesso a outros arquivos</strong> do seu dispositivo. Você pode ver,
        gerenciar e excluir os cookies a qualquer momento pelas configurações do seu navegador.
      </p>
      <h3>6.2 Cookies que Utilizamos</h3>
      <table>
        <thead>
          <tr><th>Tipo</th><th>Finalidade</th><th>Exemplos de uso</th><th>Pode ser desativado?</th><th>Duração típica</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Essenciais</strong></td>
            <td>Manter a sessão de login ativa, segurança contra CSRF, autenticação</td>
            <td>Você faz login uma vez e a sessão é mantida; proteção contra ataques de falsificação de requisição</td>
            <td>❌ Não (sem eles, a plataforma não funciona)</td>
            <td>Sessão ou até 30 dias</td>
          </tr>
          <tr>
            <td><strong>Funcionais</strong></td>
            <td>Guardar preferências do usuário para melhorar a experiência</td>
            <td>Tema claro/escuro, tamanho de tabelas, filtros salvos, idioma preferido</td>
            <td>✅ Sim (com perda das preferências salvas)</td>
            <td>Até 1 ano</td>
          </tr>
          <tr>
            <td><strong>Analíticos</strong></td>
            <td>Entender como a plataforma é usada para melhorá-la</td>
            <td>Quais funcionalidades são mais usadas, onde os usuários têm dificuldade, tempo de carregamento das páginas</td>
            <td>✅ Sim (sem impacto na funcionalidade)</td>
            <td>Até 1 ano</td>
          </tr>
        </tbody>
      </table>
      <h3>6.3 O Que Não Usamos</h3>
      <p>
        O ObrasFlow <strong>não utiliza</strong> cookies de publicidade (para mostrar anúncios),
        cookies de rastreamento cross-site (para seguir você em outros sites), nem pixels de
        conversão de redes sociais ou plataformas de anúncios.
      </p>
      <h3>6.4 Como Gerenciar Cookies</h3>
      <p>
        Você pode gerenciar seus cookies de duas formas:
      </p>
      <ul>
        <li>
          <strong>Dentro da plataforma:</strong> Acesse Configurações → Privacidade → Preferências
          de Cookies para gerenciar cookies funcionais e analíticos;
        </li>
        <li>
          <strong>No seu navegador:</strong> Todos os navegadores modernos permitem visualizar,
          bloquear e excluir cookies. Consulte as instruções do seu navegador (Chrome, Firefox,
          Safari, Edge) para saber como fazer isso. Observe que bloquear cookies essenciais
          impedirá o funcionamento da plataforma.
        </li>
      </ul>

      {/* 7 */}
      <h2><span className="num">7</span> Como e Por Quanto Tempo Armazenamos seus Dados</h2>
      <h3>7.1 Onde Seus Dados são Armazenados</h3>
      <p>
        Seus dados são armazenados em servidores seguros hospedados em infraestrutura de nuvem
        profissional. Trabalhamos com provedores que possuem certificações de segurança
        reconhecidas internacionalmente. Os dados são preferencialmente armazenados em território
        brasileiro ou em países com grau de proteção adequado à LGPD.
      </p>
      <p>
        Todos os dados são armazenados de forma <strong>criptografada</strong>. Backups são
        realizados diariamente e armazenados em localização geográfica diferente do servidor
        principal, para garantia de recuperação em caso de desastre.
      </p>
      <h3>7.2 Medidas de Segurança Técnicas</h3>
      <p>
        Implementamos as seguintes medidas para proteger seus dados armazenados:
      </p>
      <ul>
        <li><strong>Criptografia em trânsito:</strong> TLS 1.2+ (HTTPS) em todas as comunicações. Nenhum dado trafega em texto claro pela internet;</li>
        <li><strong>Criptografia em repouso:</strong> Dados sensíveis armazenados com AES-256, padrão militar de criptografia;</li>
        <li><strong>Isolamento de dados:</strong> Dados de cada empresa isolados em nível de banco de dados (row-level security), garantindo que vazamentos em um tenant não afetem outros;</li>
        <li><strong>Hash de senhas:</strong> Bcrypt com fator de custo mínimo 12. É computacionalmente inviável reverter o hash para obter a senha original;</li>
        <li><strong>Controle de acesso:</strong> Somente funcionários com necessidade operacional comprovada têm acesso a dados de produção, mediante autenticação de dois fatores e registro de acesso;</li>
        <li><strong>Auditoria:</strong> Todas as operações em dados de produção são registradas em logs de auditoria imutáveis.</li>
      </ul>
      <h3>7.3 Medidas Organizacionais</h3>
      <ul>
        <li>Política interna de segurança da informação documentada e revisada periodicamente;</li>
        <li>Treinamento obrigatório de segurança e privacidade para todos os colaboradores;</li>
        <li>Acordos de confidencialidade (NDAs) com todos os funcionários e prestadores de serviço que acessam dados;</li>
        <li>Processo formal de resposta a incidentes de segurança;</li>
        <li>Revisões periódicas de segurança e penetration testing.</li>
      </ul>
      <h3>7.4 Prazos de Retenção de Dados</h3>
      <p>
        Mantemos seus dados apenas pelo tempo necessário para cumprir a finalidade para a qual
        foram coletados, ou pelo prazo mínimo exigido por lei, o que for maior:
      </p>
      <table>
        <thead>
          <tr><th>Tipo de dado</th><th>Prazo de retenção</th><th>Base legal / Motivo</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Dados de conta ativa (perfil, configurações)</td>
            <td>Enquanto a conta estiver ativa</td>
            <td>Necessário para a execução do contrato</td>
          </tr>
          <tr>
            <td>Conteúdo operacional (obras, projetos, etc.)</td>
            <td>Enquanto a conta estiver ativa + 90 dias após encerramento</td>
            <td>Garantia de recuperação e eventual reativação</td>
          </tr>
          <tr>
            <td>Dados financeiros e faturas</td>
            <td>5 anos após a emissão</td>
            <td>Obrigação fiscal — Código Tributário Nacional (CTN, art. 195) e legislação contábil</td>
          </tr>
          <tr>
            <td>Logs de acesso (IP, data/hora)</td>
            <td>6 meses</td>
            <td>Obrigação legal — Marco Civil da Internet (art. 15)</td>
          </tr>
          <tr>
            <td>Logs de aplicação e auditoria</td>
            <td>12 meses</td>
            <td>Segurança, investigação de incidentes e auditoria interna</td>
          </tr>
          <tr>
            <td>Comunicações com suporte</td>
            <td>3 anos</td>
            <td>Histórico de atendimento e eventual litígio (prazo prescricional geral do Código Civil)</td>
          </tr>
          <tr>
            <td>Dados de marketing (consentimento)</td>
            <td>Até revogação do consentimento + 5 anos (para comprovar o consentimento)</td>
            <td>Consentimento LGPD + obrigação de demonstrar compliance</td>
          </tr>
          <tr>
            <td>Dados após processo judicial</td>
            <td>Até trânsito em julgado + 5 anos</td>
            <td>Exercício regular de direitos (LGPD art. 7º, VI)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Ao final do prazo de retenção, os dados são <strong>excluídos de forma segura</strong>
        (sobrescrita múltipla ou exclusão certificada do armazenamento) ou{" "}
        <strong>anonimizados de maneira tecnicamente irreversível</strong>, de modo que não seja
        mais possível associá-los a um indivíduo identificado ou identificável.
      </p>

      {/* 8 */}
      <h2><span className="num">8</span> Seus Direitos como Titular — Você Tem Controle</h2>
      <p>
        A LGPD garante a você, como titular de dados pessoais, um conjunto completo de direitos.
        O ObrasFlow não apenas cumpre esses direitos por obrigação legal — acreditamos genuinamente
        que você deve ter controle sobre seus próprios dados. Abaixo, explicamos cada direito em
        linguagem simples e como exercê-los:
      </p>

      <h3>Direito 1 — Confirmação e Acesso (art. 18, I e II da LGPD)</h3>
      <p>
        <strong>O que é:</strong> Você tem o direito de saber se tratamos dados seus e, em caso
        afirmativo, ter acesso a uma cópia completa desses dados.
      </p>
      <p>
        <strong>Na prática:</strong> Você pode solicitar um relatório completo com todos os dados
        que temos sobre você — desde informações de perfil até logs de acesso.
      </p>
      <p>
        <strong>Como exercer:</strong> Acesse Configurações → Segurança e LGPD → Solicitar Meus
        Dados. Responderemos em até 15 dias.
      </p>

      <h3>Direito 2 — Correção (art. 18, III da LGPD)</h3>
      <p>
        <strong>O que é:</strong> Você tem o direito de corrigir dados incompletos, inexatos ou
        desatualizados que temos sobre você.
      </p>
      <p>
        <strong>Na prática:</strong> Se seu nome está errado, se seu e-mail mudou, se os dados
        da empresa estão desatualizados — você pode corrigir isso.
      </p>
      <p>
        <strong>Como exercer:</strong> Muitos dados podem ser corrigidos diretamente no perfil.
        Para dados que não conseguir alterar sozinho, entre em contato com o suporte.
      </p>

      <h3>Direito 3 — Anonimização, Bloqueio ou Exclusão (art. 18, IV da LGPD)</h3>
      <p>
        <strong>O que é:</strong> Você tem o direito de solicitar que dados desnecessários,
        excessivos ou tratados em desconformidade com a LGPD sejam anonimizados, bloqueados
        ou excluídos.
      </p>
      <p>
        <strong>Na prática:</strong> Se você acredita que estamos tratando algum dado sem
        necessidade ou sem base legal adequada, pode pedir que paremos.
      </p>
      <p>
        <strong>Como exercer:</strong> Acesse Configurações → Segurança e LGPD → Solicitar
        Exclusão ou entre em contato com o DPO.
      </p>
      <p>
        <strong>Observação:</strong> Não podemos excluir dados que temos obrigação legal de manter
        (como registros fiscais) ou que são necessários para cumprir o contrato ativo.
      </p>

      <h3>Direito 4 — Portabilidade (art. 18, V da LGPD)</h3>
      <p>
        <strong>O que é:</strong> Você tem o direito de receber seus dados em formato estruturado,
        legível por máquina e interoperável, para poder migrá-los para outro serviço.
      </p>
      <p>
        <strong>Na prática:</strong> Você pode exportar todos os seus dados (obras, projetos,
        clientes, documentos, etc.) em formatos padrão (JSON, CSV, Excel, PDF).
      </p>
      <p>
        <strong>Como exercer:</strong> Acesse Configurações → Exportar Dados para exportações
        completas ou por módulo.
      </p>

      <h3>Direito 5 — Eliminação com Base no Consentimento (art. 18, VI da LGPD)</h3>
      <p>
        <strong>O que é:</strong> Para dados que tratamos com base no seu consentimento (como
        marketing), você pode solicitar a eliminação desses dados ao revogar o consentimento.
      </p>
      <p>
        <strong>Como exercer:</strong> Revogue o consentimento em Configurações → Privacidade →
        Consentimentos. A eliminação ocorrerá conforme os prazos legais.
      </p>

      <h3>Direito 6 — Informação sobre Compartilhamento (art. 18, VII da LGPD)</h3>
      <p>
        <strong>O que é:</strong> Você tem o direito de saber com quais entidades públicas e
        privadas compartilhamos seus dados.
      </p>
      <p>
        <strong>Como exercer:</strong> Todas as informações sobre compartilhamento estão nesta
        Política, Seção 5. Caso queira informações mais específicas, entre em contato com o DPO.
      </p>

      <h3>Direito 7 — Revogação do Consentimento (art. 18, IX da LGPD)</h3>
      <p>
        <strong>O que é:</strong> Para qualquer tratamento baseado em consentimento, você pode
        revogar esse consentimento a qualquer momento, sem nenhum prejuízo ao uso da plataforma.
      </p>
      <p>
        <strong>Na prática:</strong> Revogar o consentimento para marketing não afeta em nada
        o seu acesso à plataforma — apenas para de receber e-mails promocionais.
      </p>
      <p>
        <strong>Como exercer:</strong> Configurações → Privacidade → Consentimentos, ou pelo
        link "cancelar inscrição" em qualquer e-mail de marketing.
      </p>

      <h3>Direito 8 — Oposição ao Tratamento (art. 18, §2º da LGPD)</h3>
      <p>
        <strong>O que é:</strong> Você pode se opor a tratamentos realizados com base em
        "legítimo interesse" quando entender que esses tratamentos não cumprem os requisitos
        legais ou prejudicam seus direitos.
      </p>
      <p>
        <strong>Como exercer:</strong> Entre em contato com o DPO descrevendo o tratamento que
        questiona. Analisaremos seu caso e responderemos em até 15 dias.
      </p>

      <h3>Direito 9 — Revisão de Decisões Automatizadas (art. 20 da LGPD)</h3>
      <p>
        <strong>O que é:</strong> Se alguma decisão que afete seus interesses for tomada
        exclusivamente de forma automatizada (por algoritmos, sem intervenção humana), você
        tem o direito de solicitar revisão por uma pessoa.
      </p>
      <p>
        <strong>Como exercer:</strong> Entre em contato com o suporte descrevendo a decisão
        automatizada que questiona.
      </p>

      <h3>Direito 10 — Petição à ANPD (art. 18, VIII da LGPD)</h3>
      <p>
        <strong>O que é:</strong> Se você acreditar que o ObrasFlow violou algum dos seus
        direitos previstos na LGPD e não conseguiu resolver pela comunicação direta conosco,
        você tem o direito de encaminhar uma reclamação formal à Autoridade Nacional de Proteção
        de Dados (ANPD).
      </p>
      <p>
        <strong>Como exercer:</strong> Acesse gov.br/anpd e siga as instruções para abertura
        de reclamação. Recomendamos tentar resolver diretamente conosco primeiro — acreditamos
        que a maioria dos casos tem solução amigável.
      </p>

      <div className="info-box">
        <strong>⏱️ Prazo de resposta:</strong> Responderemos a todas as solicitações de
        exercício de direitos em até <strong>15 dias corridos</strong>, podendo prorrogar por
        igual período em casos complexos, mediante justificativa. Você sempre será informado
        sobre o andamento da sua solicitação. Para exercer qualquer direito, acesse
        Configurações → Segurança e LGPD ou entre em contato com nosso DPO.
      </div>

      {/* 9 */}
      <h2><span className="num">9</span> Segurança das Credenciais de Acesso</h2>
      <h3>9.1 Campos de Login Sempre Limpos</h3>
      <p>
        Os campos de e-mail e senha na tela de login são sempre carregados <strong>completamente
        em branco</strong>, sem preenchimento automático baseado em sessões anteriores de outros
        usuários. Isso é especialmente importante em ambientes compartilhados (como computadores
        de escritório usados por várias pessoas), onde informações de um usuário não devem ser
        exibidas para outro. Implementamos atributos específicos no código para garantir isso
        tecnicamente, independentemente das configurações do navegador.
      </p>
      <h3>9.2 Como Armazenamos Senhas</h3>
      <p>
        Senhas são armazenadas usando o algoritmo <strong>bcrypt</strong> com fator de custo
        mínimo 12. Isso significa que:
      </p>
      <ul>
        <li>A senha é transformada em um hash (código embaralhado irreversível) antes de ser salva;</li>
        <li>Não existe nenhum processo que possa converter o hash de volta para a senha original;</li>
        <li>Nenhum funcionário, nem mesmo o desenvolvedor do sistema, pode ver sua senha;</li>
        <li>Se você esquecer a senha, ela precisa ser <em>redefinida</em> (não recuperada), porque ela não existe em formato legível em nenhum lugar;</li>
        <li>Mesmo que nosso banco de dados fosse completamente comprometido por um invasor, as senhas seriam inúteis para ele.</li>
      </ul>

      {/* 10 */}
      <h2><span className="num">10</span> Transferência Internacional de Dados</h2>
      <p>
        Alguns dos nossos parceiros técnicos operam servidores fora do Brasil. Quando isso ocorre,
        garantimos que a transferência internacional de dados pessoais cumpre os requisitos da LGPD:
      </p>
      <ul>
        <li>
          <strong>Países com grau de proteção adequado:</strong> Transferimos dados apenas para
          países que a ANPD reconhecer como tendo grau de proteção equivalente ao da LGPD;
        </li>
        <li>
          <strong>Cláusulas contratuais padrão:</strong> Quando o país não tem reconhecimento de
          adequação, exigimos dos nossos parceiros a adoção de cláusulas contratuais aprovadas
          pela ANPD ou por autoridades de proteção equivalentes;
        </li>
        <li>
          <strong>Stripe (EUA):</strong> A Stripe é certificada PCI-DSS nível 1 e adota medidas
          de proteção compatíveis com o GDPR europeu e com a LGPD brasileira, incluindo cláusulas
          contratuais padrão para transferências internacionais;
        </li>
        <li>
          <strong>Provedores de nuvem:</strong> Nossos provedores de infraestrutura possuem
          certificações internacionais de segurança (ISO 27001, SOC 2, etc.) e estão sujeitos
          a acordos de processamento de dados com cláusulas de proteção adequadas.
        </li>
      </ul>

      {/* 11 */}
      <h2><span className="num">11</span> Menores de Idade — Proteção Especial</h2>
      <p>
        O ObrasFlow é uma plataforma de uso profissional e corporativo. <strong>Não é
        destinada, em nenhuma hipótese, a menores de 18 (dezoito) anos</strong>.
      </p>
      <p>
        Não coletamos intencionalmente dados pessoais de menores de 18 anos. Se um menor tentar
        se cadastrar, o sistema não permitirá a criação da conta. Se, de alguma forma,
        identificarmos ou recebermos comunicação de que dados de um menor foram coletados
        inadvertidamente, tomaremos imediatamente as seguintes medidas: (i) suspender o acesso
        da conta; (ii) notificar o responsável legal, se identificado; (iii) excluir os dados
        do menor de forma segura e permanente.
      </p>
      <p>
        Se você é pai, mãe ou responsável legal e acredita que um menor sob sua guarda forneceu
        dados ao ObrasFlow, entre em contato com nosso suporte imediatamente pelo canal de
        atendimento disponível na plataforma.
      </p>

      {/* 12 */}
      <h2><span className="num">12</span> O Que Acontece em Caso de Incidente de Segurança</h2>
      <p>
        Mesmo com todas as medidas de segurança implementadas, nenhum sistema é 100% inviolável.
        Por isso, temos um plano claro de como agir caso ocorra um incidente de segurança que
        possa afetar seus dados:
      </p>
      <h3>12.1 Detecção e Contenção</h3>
      <p>
        Ao detectar um incidente de segurança (vazamento, acesso não autorizado, alteração
        indevida de dados, etc.), nossa equipe de segurança agirá imediatamente para:
        (i) conter o incidente e impedir que se expanda; (ii) identificar os dados afetados;
        (iii) identificar a causa e corrigi-la; (iv) preservar evidências para investigação.
      </p>
      <h3>12.2 Notificação à ANPD</h3>
      <p>
        Conforme exigido pelo art. 48 da LGPD, o ObrasFlow notificará a Autoridade Nacional de
        Proteção de Dados (ANPD) dentro de <strong>72 horas</strong> após tomar conhecimento de
        um incidente de segurança que possa acarretar risco ou dano relevante aos titulares de
        dados. A notificação incluirá: (i) descrição do incidente; (ii) natureza e categoria dos
        dados afetados; (iii) número estimado de titulares afetados; (iv) medidas de mitigação
        adotadas.
      </p>
      <h3>12.3 Notificação aos Titulares Afetados</h3>
      <p>
        Titulares cujos dados forem afetados pelo incidente serão notificados em prazo razoável,
        com informações claras sobre: (i) o que aconteceu; (ii) quais dados foram afetados;
        (iii) os possíveis riscos para você; (iv) o que fizemos para corrigir o problema;
        (v) as medidas que você pode tomar para se proteger; (vi) como entrar em contato conosco
        para mais informações.
      </p>
      <div className="highlight-box">
        <strong>Transparência total em incidentes:</strong> Não vamos esconder incidentes de
        segurança. Acreditamos que informar as pessoas afetadas o mais rápido possível é não
        apenas uma obrigação legal, mas uma questão de respeito e responsabilidade.
      </div>

      {/* 13 */}
      <h2><span className="num">13</span> Comunicações de Marketing — Opt-in e Opt-out</h2>
      <p>
        Queremos ser uma fonte de valor para você, não de incômodo. Por isso, nossa política de
        comunicações de marketing é bastante direta:
      </p>
      <ul>
        <li>
          <strong>Só enviamos marketing se você pediu (opt-in):</strong> E-mails de novidades,
          dicas, promoções e conteúdo educacional são enviados apenas para usuários que marcaram
          explicitamente a opção de receber esses comunicados, seja no momento do cadastro ou
          posteriormente nas configurações;
        </li>
        <li>
          <strong>Cancelamento imediato (opt-out):</strong> Você pode parar de receber e-mails
          de marketing a qualquer momento, de duas formas: (1) clicando no link "cancelar
          inscrição" no rodapé de qualquer e-mail de marketing; (2) acessando Configurações →
          Notificações → E-mails de Marketing. O cancelamento é processado em até 48 horas;
        </li>
        <li>
          <strong>Comunicações essenciais não são marketing:</strong> Faturas, alertas de
          segurança, avisos de manutenção e alterações nos Termos são comunicações necessárias
          para o funcionamento do serviço, não marketing. Essas não podem ser desativadas
          enquanto a conta estiver ativa;
        </li>
        <li>
          <strong>Não usamos dados de uso para personalizar marketing invasivo:</strong> Não
          analisamos o conteúdo das suas obras para enviar publicidade. As comunicações de
          marketing são gerais e baseadas no perfil do plano contratado.
        </li>
      </ul>

      {/* 14 */}
      <h2><span className="num">14</span> Links e Integrações com Serviços Externos</h2>
      <p>
        A plataforma ObrasFlow pode conter links para sites externos ou oferecer integrações
        com serviços de terceiros. É importante que você saiba que:
      </p>
      <ul>
        <li>
          Ao clicar em um link para um site externo, você deixará a plataforma ObrasFlow e estará
          sujeito à política de privacidade do site de destino, que é independente desta Política;
        </li>
        <li>
          Ao ativar uma integração com um serviço externo (WhatsApp, Stripe, etc.), parte dos
          seus dados pode ser compartilhada com esse serviço conforme necessário para o
          funcionamento da integração. Você será informado sobre quais dados são compartilhados
          antes de ativar cada integração;
        </li>
        <li>
          O ObrasFlow não se responsabiliza pelo conteúdo, práticas de privacidade, políticas
          de segurança ou disponibilidade de sites e serviços externos;
        </li>
        <li>
          Recomendamos que você leia a política de privacidade de qualquer serviço externo antes
          de fornecer seus dados.
        </li>
      </ul>

      {/* 15 */}
      <h2><span className="num">15</span> Alterações nesta Política de Privacidade</h2>
      <p>
        Esta Política pode precisar ser atualizada ao longo do tempo por diversas razões: mudanças
        na legislação, novas funcionalidades da plataforma, novos parceiros técnicos ou melhorias
        nas nossas práticas de privacidade. Comprometemo-nos a fazer essas atualizações de forma
        transparente:
      </p>
      <ul>
        <li>
          <strong>Alterações materiais</strong> (que afetam como tratamos seus dados, seus
          direitos ou nossas obrigações): serão comunicadas com antecedência mínima de
          <strong> 30 dias</strong> por e-mail e por aviso destacado dentro da plataforma,
          antes de entrarem em vigor;
        </li>
        <li>
          <strong>Alterações não materiais</strong> (correções de texto, esclarecimentos sem
          impacto ao titular, atualização de links): podem ser realizadas sem aviso prévio;
        </li>
        <li>
          A versão atualizada ficará sempre disponível em /privacidade. A data de "Última
          atualização" e o número de versão no topo do documento indicam quando ocorreu a última
          revisão. Você pode acompanhar o histórico de versões pelo canal de suporte;
        </li>
        <li>
          O uso continuado da plataforma após a data de vigência das alterações implica aceite
          das novas práticas. Se não concordar com as alterações, você pode encerrar sua conta
          antes da data de vigência;
        </li>
        <li>
          Para alterações que reduzam significativamente a proteção dos seus dados, pediremos
          seu consentimento expresso antes de aplicá-las.
        </li>
      </ul>

      {/* 16 */}
      <h2><span className="num">16</span> Como Entrar em Contato — Canais de Privacidade</h2>
      <p>
        Para qualquer questão relacionada à privacidade dos seus dados, aos seus direitos como
        titular ou ao conteúdo desta Política, você pode nos contatar pelos seguintes canais:
      </p>
      <table>
        <thead>
          <tr><th>Canal</th><th>Como acessar</th><th>Para que usar</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Portal de Privacidade</strong></td>
            <td>Configurações → Segurança e LGPD</td>
            <td>Solicitações de acesso a dados, correção, exclusão, portabilidade e todas as solicitações formais de exercício de direitos</td>
          </tr>
          <tr>
            <td><strong>Contato com o DPO</strong></td>
            <td>Configurações → Segurança e LGPD → Contatar DPO</td>
            <td>Questões complexas de privacidade, oposição ao tratamento, dúvidas sobre bases legais</td>
          </tr>
          <tr>
            <td><strong>Suporte Geral</strong></td>
            <td>Ícone de ajuda na plataforma ou seção SAC do site</td>
            <td>Dúvidas gerais, problemas técnicos relacionados a privacidade, denúncias de uso indevido</td>
          </tr>
          <tr>
            <td><strong>E-mail oficial</strong></td>
            <td>Disponível na seção de Contato do site</td>
            <td>Comunicações formais e urgentes</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>Prazo de resposta:</strong> Nos comprometemos a responder todas as solicitações
        em até 15 dias corridos. Solicitações urgentes de segurança (como suspeita de acesso
        não autorizado) são tratadas com prioridade máxima.
      </p>
      <div className="info-box">
        <strong>🏛️ Autoridade Nacional de Proteção de Dados (ANPD):</strong><br />
        Se você não ficar satisfeito com nossa resposta ou acreditar que seus direitos foram
        violados, você tem o direito de encaminhar uma reclamação diretamente à ANPD —
        o órgão federal responsável por fiscalizar o cumprimento da LGPD no Brasil.<br /><br />
        <strong>Site:</strong> gov.br/anpd<br />
        <strong>Portal do Cidadão:</strong> Disponível no site da ANPD para abertura de
        reclamações formais.
      </div>

      <div className="info-box" style={{ marginTop: 32 }}>
        <strong>📋 Histórico de versões:</strong><br />
        • Versão 1.0 — Primeira versão (resumida)<br />
        • Versão 2.0 — Reescrita completa com 16 seções (26/05/2026)<br />
        • Versão 3.0 — Versão atual, máximo detalhamento e acessibilidade (26/05/2026)<br /><br />
        Para solicitar versões anteriores ou histórico de alterações, entre em contato com
        nosso DPO.
      </div>

      <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" as const }}>
        <Link href="/termos" className="of-btn-secondary" style={{ display: "inline-block" }}>
          Ver Termos de Uso
        </Link>
        <Link href="/cadastro" className="of-btn-primary" style={{ display: "inline-block" }}>
          Voltar ao cadastro
        </Link>
      </div>
    </LegalPageShell>
  );
}
