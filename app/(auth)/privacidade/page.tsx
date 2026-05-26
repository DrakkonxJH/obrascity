import Link from "next/link";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export default function PrivacidadePage() {
  return (
    <LegalPageShell
      title="Política de Privacidade"
      subtitle="Última atualização: 26 de maio de 2026 · Versão 2.0 · Adequada à LGPD (Lei nº 13.709/2018)"
    >
      <div className="highlight-box">
        <strong>Seu dado é seu.</strong> Esta Política de Privacidade explica, de forma clara e
        detalhada, quais dados coletamos, por quê, como utilizamos, com quem compartilhamos e como
        você pode exercer seus direitos. Leia com atenção — é seu direito saber tudo isso.
      </div>

      {/* 1 */}
      <h2><span className="num">1</span> Quem Somos — Identificação do Controlador</h2>
      <p>
        O <strong>ObrasFlow</strong> é o controlador dos dados pessoais tratados por meio desta
        plataforma, nos termos do art. 5º, VI, da Lei nº 13.709/2018 (LGPD). Isso significa que
        somos responsáveis por definir as finalidades e os meios do tratamento dos seus dados.
      </p>
      <p>
        O Encarregado pelo Tratamento de Dados Pessoais (DPO) pode ser contatado pelo canal de
        suporte da plataforma, na seção "Privacidade e LGPD". Toda solicitação formal de exercício
        de direitos deve ser feita por escrito através desse canal.
      </p>
      <div className="info-box">
        Quando o Usuário (empresa cliente) insere dados de terceiros na plataforma (funcionários,
        clientes, fornecedores), o Usuário passa a ser o <strong>controlador</strong> desses dados e
        o ObrasFlow atua como <strong>operador</strong>, nos termos do art. 5º, VII, da LGPD.
      </div>

      {/* 2 */}
      <h2><span className="num">2</span> Quais Dados Coletamos e Como</h2>
      <h3>2.1 Dados fornecidos diretamente pelo Usuário</h3>
      <table>
        <thead>
          <tr><th>Categoria</th><th>Dados</th><th>Quando coletado</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Identificação</td>
            <td>Nome completo, e-mail, telefone, CPF/CNPJ (opcional)</td>
            <td>Cadastro e perfil</td>
          </tr>
          <tr>
            <td>Empresa</td>
            <td>Razão social, CNPJ, endereço, setor de atuação</td>
            <td>Configuração da conta</td>
          </tr>
          <tr>
            <td>Acesso</td>
            <td>Senha (armazenada com hash bcrypt, nunca em texto claro)</td>
            <td>Cadastro / alteração</td>
          </tr>
          <tr>
            <td>Pagamento</td>
            <td>Dados de cobrança (processados pelo Stripe — não armazenamos dados de cartão)</td>
            <td>Contratação de plano</td>
          </tr>
          <tr>
            <td>Conteúdo operacional</td>
            <td>Dados de obras, projetos, diários, fotos, documentos, medições, relatórios</td>
            <td>Uso da plataforma</td>
          </tr>
          <tr>
            <td>Comunicação</td>
            <td>Mensagens enviadas ao suporte, feedbacks, solicitações</td>
            <td>Interação com suporte</td>
          </tr>
          <tr>
            <td>Terceiros cadastrados</td>
            <td>Dados de funcionários, clientes e fornecedores inseridos pelo Usuário</td>
            <td>Uso dos módulos CRM/Equipe</td>
          </tr>
        </tbody>
      </table>

      <h3>2.2 Dados coletados automaticamente</h3>
      <table>
        <thead>
          <tr><th>Categoria</th><th>Dados</th><th>Finalidade</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Acesso</td>
            <td>Endereço IP, data/hora do acesso, dispositivo, navegador, sistema operacional</td>
            <td>Segurança e auditoria</td>
          </tr>
          <tr>
            <td>Uso</td>
            <td>Páginas visitadas, funcionalidades utilizadas, tempo de sessão, cliques</td>
            <td>Melhoria da plataforma</td>
          </tr>
          <tr>
            <td>Logs</td>
            <td>Registros de operações críticas (login, exclusão, exportação)</td>
            <td>Auditoria e segurança</td>
          </tr>
          <tr>
            <td>Cookies</td>
            <td>Ver Seção 6 — Política de Cookies</td>
            <td>Sessão e preferências</td>
          </tr>
          <tr>
            <td>Localização</td>
            <td>Localização aproximada derivada do IP (país/estado)</td>
            <td>Segurança e conformidade</td>
          </tr>
        </tbody>
      </table>

      <h3>2.3 Dados que NÃO coletamos</h3>
      <ul>
        <li>Dados biométricos (impressão digital, reconhecimento facial);</li>
        <li>Dados de saúde ou origem racial/étnica do Usuário;</li>
        <li>Dados de cartão de crédito ou débito (processados diretamente pelo Stripe);</li>
        <li>Senhas em texto claro (armazenadas apenas em formato hash irreversível).</li>
      </ul>

      {/* 3 */}
      <h2><span className="num">3</span> Para Que Usamos Seus Dados — Finalidades</h2>
      <p>
        Cada dado coletado tem uma finalidade específica e legítima. Não utilizamos seus dados para
        fins incompatíveis com os listados abaixo:
      </p>
      <table>
        <thead>
          <tr><th>Finalidade</th><th>Descrição</th><th>Base Legal (LGPD)</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Prestação do serviço</td>
            <td>Criar e manter sua conta, autenticar acessos, exibir e processar dados operacionais</td>
            <td>Execução de contrato (art. 7º, V)</td>
          </tr>
          <tr>
            <td>Cobrança e faturamento</td>
            <td>Processar pagamentos, emitir faturas, gerenciar assinaturas</td>
            <td>Execução de contrato (art. 7º, V)</td>
          </tr>
          <tr>
            <td>Suporte ao usuário</td>
            <td>Responder solicitações, resolver problemas, oferecer assistência técnica</td>
            <td>Execução de contrato (art. 7º, V)</td>
          </tr>
          <tr>
            <td>Segurança</td>
            <td>Prevenir fraudes, acessos não autorizados, ataques e uso indevido</td>
            <td>Legítimo interesse (art. 7º, IX)</td>
          </tr>
          <tr>
            <td>Conformidade legal</td>
            <td>Cumprir obrigações legais, responder a autoridades competentes</td>
            <td>Obrigação legal (art. 7º, II)</td>
          </tr>
          <tr>
            <td>Melhoria da plataforma</td>
            <td>Analisar uso agregado e anonimizado para desenvolver novas funcionalidades</td>
            <td>Legítimo interesse (art. 7º, IX)</td>
          </tr>
          <tr>
            <td>Comunicações essenciais</td>
            <td>Notificações sobre a conta, faturas, alertas de segurança e alterações nos termos</td>
            <td>Execução de contrato / Legítimo interesse</td>
          </tr>
          <tr>
            <td>Comunicações de marketing</td>
            <td>Novidades, atualizações de produto e promoções (apenas com opt-in)</td>
            <td>Consentimento (art. 7º, I)</td>
          </tr>
        </tbody>
      </table>
      <div className="highlight-box">
        <strong>Não vendemos seus dados.</strong> O ObrasFlow não comercializa, aluga ou cede dados
        pessoais de usuários a terceiros para fins de marketing ou publicidade. Jamais.
      </div>

      {/* 4 */}
      <h2><span className="num">4</span> Bases Legais para o Tratamento de Dados</h2>
      <p>
        Conforme exigido pela LGPD, todo tratamento de dados pessoais realizado pelo ObrasFlow possui
        uma base legal que o justifica. As bases que utilizamos são:
      </p>
      <ul>
        <li><strong>Execução de contrato (art. 7º, V):</strong> tratamento necessário para fornecer os serviços contratados pelo Usuário.</li>
        <li><strong>Cumprimento de obrigação legal (art. 7º, II):</strong> quando a lei exige que mantenhamos ou fornecemos determinados dados a autoridades.</li>
        <li><strong>Legítimo interesse (art. 7º, IX):</strong> para finalidades como segurança, prevenção a fraudes e melhoria do serviço, sempre garantindo que não prevaleça sobre os direitos do titular.</li>
        <li><strong>Consentimento (art. 7º, I):</strong> para comunicações de marketing e funcionalidades opcionais. O consentimento pode ser revogado a qualquer momento sem prejuízo.</li>
        <li><strong>Proteção da vida (art. 7º, III):</strong> em situações excepcionais de emergência que envolvam risco à vida.</li>
      </ul>

      {/* 5 */}
      <h2><span className="num">5</span> Com Quem Compartilhamos Seus Dados</h2>
      <p>
        O ObrasFlow compartilha dados pessoais somente quando necessário para a prestação dos serviços
        ou quando exigido por lei. Abaixo estão todos os cenários de compartilhamento:
      </p>
      <h3>5.1 Prestadores de Serviço (Suboperadores)</h3>
      <p>
        Trabalhamos com prestadores de serviço especializados que atuam como suboperadores, sujeitos
        a contratos com cláusulas de proteção de dados equivalentes às desta Política:
      </p>
      <ul>
        <li><strong>Stripe:</strong> processamento de pagamentos. Os dados de cartão são tratados diretamente pelo Stripe, certificado PCI-DSS nível 1. Stripe Privacy Policy: stripe.com/privacy.</li>
        <li><strong>Provedores de infraestrutura em nuvem:</strong> hospedagem, armazenamento e processamento de dados em servidores seguros.</li>
        <li><strong>Serviços de e-mail transacional:</strong> envio de notificações e confirmações de conta.</li>
        <li><strong>Serviços de monitoramento e analytics:</strong> análise agregada de uso da plataforma, sem identificação individual.</li>
      </ul>
      <h3>5.2 Autoridades e Obrigações Legais</h3>
      <p>
        Podemos divulgar dados pessoais quando obrigados por lei, decisão judicial, ordem de
        autoridade competente (ANPD, Ministério Público, Polícia Federal, etc.) ou para defesa
        de direitos do ObrasFlow em processos judiciais ou administrativos.
      </p>
      <h3>5.3 Reorganização Societária</h3>
      <p>
        Em caso de fusão, aquisição, venda ou reorganização do ObrasFlow, os dados podem ser
        transferidos ao novo controlador, desde que este mantenha proteções equivalentes. O Usuário
        será notificado com antecedência razoável.
      </p>
      <h3>5.4 O que NÃO fazemos</h3>
      <ul>
        <li>Não vendemos dados a terceiros;</li>
        <li>Não compartilhamos dados para fins de publicidade de terceiros;</li>
        <li>Não cruzamos dados de um tenant (empresa) com dados de outro;</li>
        <li>Não permitimos acesso de terceiros sem base legal e contratual.</li>
      </ul>

      {/* 6 */}
      <h2><span className="num">6</span> Cookies e Tecnologias de Rastreamento</h2>
      <h3>6.1 O que são Cookies</h3>
      <p>
        Cookies são pequenos arquivos de texto armazenados no seu navegador que permitem que a
        plataforma reconheça sua sessão, salve preferências e funcione corretamente. Não são vírus
        e não acessam outros arquivos do seu dispositivo.
      </p>
      <h3>6.2 Tipos de Cookies que Utilizamos</h3>
      <table>
        <thead>
          <tr><th>Tipo</th><th>Finalidade</th><th>Pode ser desativado?</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Essenciais</strong></td>
            <td>Autenticação, sessão de login, segurança CSRF. Sem estes, a plataforma não funciona.</td>
            <td>Não (necessários para o serviço)</td>
          </tr>
          <tr>
            <td><strong>Funcionais</strong></td>
            <td>Guardar preferências do usuário (tema, idioma, configurações de exibição).</td>
            <td>Sim (com perda de preferências)</td>
          </tr>
          <tr>
            <td><strong>Analíticos</strong></td>
            <td>Análise de uso da plataforma de forma agregada para melhoria contínua.</td>
            <td>Sim (via configurações de cookies)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Não utilizamos cookies de publicidade ou rastreamento cross-site de terceiros. Você pode
        gerenciar cookies pelas configurações do seu navegador ou pelo painel de preferências de
        cookies disponível na plataforma.
      </p>

      {/* 7 */}
      <h2><span className="num">7</span> Armazenamento, Segurança e Retenção dos Dados</h2>
      <h3>7.1 Onde são armazenados</h3>
      <p>
        Os dados são armazenados em servidores localizados no Brasil e/ou em países que oferecem
        grau de proteção de dados pessoais adequado à legislação brasileira. Todos os contratos com
        provedores de infraestrutura incluem cláusulas de proteção de dados.
      </p>
      <h3>7.2 Medidas de Segurança</h3>
      <p>Implementamos as seguintes medidas técnicas e organizacionais de segurança:</p>
      <ul>
        <li><strong>Técnicas:</strong> criptografia TLS/HTTPS em trânsito, AES-256 em repouso para dados sensíveis, hash bcrypt para senhas, isolamento por tenant, autenticação multifator disponível, tokens JWT com expiração, proteção contra injeção de SQL e XSS;</li>
        <li><strong>Organizacionais:</strong> controle de acesso mínimo necessário por função (princípio do menor privilégio), treinamento da equipe, políticas internas de segurança da informação, auditorias periódicas, plano de resposta a incidentes;</li>
        <li><strong>Operacionais:</strong> backups automáticos diários, monitoramento contínuo de logs de acesso, alertas de atividade suspeita.</li>
      </ul>
      <h3>7.3 Prazos de Retenção</h3>
      <table>
        <thead>
          <tr><th>Tipo de dado</th><th>Prazo de retenção</th><th>Fundamento</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Dados de conta ativa</td>
            <td>Enquanto a conta estiver ativa</td>
            <td>Execução do contrato</td>
          </tr>
          <tr>
            <td>Dados após cancelamento</td>
            <td>90 dias após o encerramento</td>
            <td>Possibilidade de reativação / backup</td>
          </tr>
          <tr>
            <td>Dados financeiros (faturas)</td>
            <td>5 anos</td>
            <td>Obrigação fiscal (CTN, art. 195)</td>
          </tr>
          <tr>
            <td>Logs de acesso</td>
            <td>6 meses</td>
            <td>Marco Civil da Internet (art. 15)</td>
          </tr>
          <tr>
            <td>Logs de aplicação</td>
            <td>12 meses</td>
            <td>Segurança e auditoria</td>
          </tr>
          <tr>
            <td>Dados de marketing (opt-in)</td>
            <td>Até revogação do consentimento</td>
            <td>Consentimento (LGPD art. 7º, I)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Ao final do prazo de retenção, os dados são excluídos de forma segura ou anonimizados de
        maneira irreversível, de modo que não possam mais ser associados a um indivíduo.
      </p>

      {/* 8 */}
      <h2><span className="num">8</span> Seus Direitos como Titular de Dados</h2>
      <p>
        A LGPD garante a você, como titular de dados pessoais, um conjunto robusto de direitos. O
        ObrasFlow respeita e facilita o exercício de todos eles:
      </p>
      <table>
        <thead>
          <tr><th>Direito</th><th>O que significa</th><th>Como exercer</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Confirmação e Acesso (art. 18, I e II)</strong></td>
            <td>Saber se tratamos seus dados e acessar cópia completa dos dados que temos sobre você</td>
            <td>Configurações → Segurança e LGPD</td>
          </tr>
          <tr>
            <td><strong>Correção (art. 18, III)</strong></td>
            <td>Corrigir dados incompletos, inexatos ou desatualizados</td>
            <td>Editar perfil ou contatar suporte</td>
          </tr>
          <tr>
            <td><strong>Anonimização, bloqueio ou exclusão (art. 18, IV)</strong></td>
            <td>Solicitar que dados desnecessários, excessivos ou tratados sem base legal sejam anonimizados, bloqueados ou excluídos</td>
            <td>Configurações → Segurança e LGPD</td>
          </tr>
          <tr>
            <td><strong>Portabilidade (art. 18, V)</strong></td>
            <td>Receber seus dados em formato estruturado e interoperável para migração</td>
            <td>Configurações → Exportar Dados</td>
          </tr>
          <tr>
            <td><strong>Eliminação com consentimento (art. 18, VI)</strong></td>
            <td>Solicitar exclusão de dados tratados com base no consentimento</td>
            <td>Revogar consentimento nas configurações</td>
          </tr>
          <tr>
            <td><strong>Informação sobre compartilhamento (art. 18, VII)</strong></td>
            <td>Saber com quais entidades públicas e privadas compartilhamos seus dados</td>
            <td>Esta Política, Seção 5</td>
          </tr>
          <tr>
            <td><strong>Revogação do consentimento (art. 18, IX)</strong></td>
            <td>Revogar o consentimento dado para tratamentos baseados nessa base legal, a qualquer momento</td>
            <td>Configurações → Privacidade</td>
          </tr>
          <tr>
            <td><strong>Oposição (art. 18, §2º)</strong></td>
            <td>Opor-se a tratamentos realizados com base em legítimo interesse quando não respeitem os requisitos legais</td>
            <td>Contato com o DPO</td>
          </tr>
          <tr>
            <td><strong>Revisão de decisão automatizada (art. 20)</strong></td>
            <td>Solicitar revisão humana de decisões tomadas exclusivamente de forma automatizada que afetem seus interesses</td>
            <td>Contato com o suporte</td>
          </tr>
          <tr>
            <td><strong>Petição à ANPD (art. 18, VIII)</strong></td>
            <td>Você tem o direito de peticionar à Autoridade Nacional de Proteção de Dados (ANPD) se entender que seus direitos foram violados</td>
            <td>gov.br/anpd</td>
          </tr>
        </tbody>
      </table>
      <h3>8.1 Prazo de Resposta</h3>
      <p>
        Responderemos às solicitações de exercício de direitos em até 15 (quinze) dias corridos,
        podendo ser prorrogado por igual período mediante justificativa, conforme recomendado pela
        ANPD. Em casos complexos, informaremos sobre o prazo estendido e os motivos.
      </p>
      <h3>8.2 Verificação de Identidade</h3>
      <p>
        Para proteger seus dados, podemos solicitar a verificação de identidade antes de atender
        determinadas solicitações, especialmente aquelas que envolvam acesso, portabilidade ou
        exclusão de dados.
      </p>
      <h3>8.3 Exceções</h3>
      <p>
        Alguns dados podem ser retidos mesmo após solicitação de exclusão quando houver: (i)
        obrigação legal de guarda; (ii) necessidade para exercício regular de direitos em processo
        judicial, administrativo ou arbitral; (iii) necessidade para proteção da vida do titular ou
        de terceiro.
      </p>

      {/* 9 */}
      <h2><span className="num">9</span> Segurança dos Dados de Login</h2>
      <p>
        Os campos de e-mail e senha da tela de login são sempre carregados em branco, sem
        preenchimento automático baseado em sessões anteriores, garantindo que informações de outros
        usuários nunca sejam exibidas indevidamente no dispositivo de outra pessoa.
      </p>
      <p>
        Senhas são armazenadas exclusivamente em formato hash com algoritmo bcrypt (fator de custo
        mínimo 12), de forma irreversível. Nenhum colaborador do ObrasFlow tem acesso à senha do
        Usuário. Em caso de esquecimento, a senha deve ser redefinida pelo fluxo de recuperação —
        não há como "recuperar" a senha anterior.
      </p>

      {/* 10 */}
      <h2><span className="num">10</span> Transferência Internacional de Dados</h2>
      <p>
        Em casos em que dados pessoais sejam transferidos para fora do Brasil (por exemplo, ao
        utilizar infraestrutura em nuvem com servidores em outros países), o ObrasFlow garante que
        tais transferências ocorram apenas para:
      </p>
      <ul>
        <li>Países com grau de proteção de dados pessoais adequado, reconhecido pela ANPD;</li>
        <li>Ou mediante a adoção de cláusulas contratuais padrão, normas corporativas globais ou outros mecanismos que garantam proteção equivalente à LGPD.</li>
      </ul>
      <p>
        O Stripe, nosso processador de pagamentos, pode processar dados em servidores nos Estados
        Unidos. A Stripe é certificada pelo Privacy Shield e adota medidas adequadas de proteção
        conforme exigências da LGPD e do GDPR europeu.
      </p>

      {/* 11 */}
      <h2><span className="num">11</span> Menores de Idade</h2>
      <p>
        A plataforma ObrasFlow é destinada exclusivamente a pessoas com 18 (dezoito) anos ou mais e
        a empresas. Não coletamos intencionalmente dados de menores de 18 anos. Se tomarmos
        conhecimento de que dados de um menor foram coletados inadvertidamente, adotaremos medidas
        para excluí-los imediatamente.
      </p>
      <p>
        Se você é pai, mãe ou responsável legal e acredita que seu filho forneceu dados pessoais à
        nossa plataforma, entre em contato com nosso suporte imediatamente.
      </p>

      {/* 12 */}
      <h2><span className="num">12</span> Incidentes de Segurança</h2>
      <p>
        Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares,
        o ObrasFlow compromete-se a:
      </p>
      <ul>
        <li>Notificar a ANPD no prazo de 72 horas após a ciência do incidente, conforme art. 48 da LGPD;</li>
        <li>Comunicar os titulares afetados em prazo razoável, com informações claras sobre a natureza do incidente, os dados afetados, as medidas tomadas e os riscos envolvidos;</li>
        <li>Adotar medidas imediatas de contenção e remediação;</li>
        <li>Documentar o incidente e as providências tomadas.</li>
      </ul>

      {/* 13 */}
      <h2><span className="num">13</span> Comunicações de Marketing</h2>
      <p>
        Enviaremos comunicações de marketing (newsletters, novidades, promoções) apenas para usuários
        que tenham explicitamente manifestado seu interesse (opt-in). Você pode cancelar o
        recebimento a qualquer momento pelo link "cancelar inscrição" presente em qualquer e-mail de
        marketing, ou pelas configurações de notificações da plataforma.
      </p>
      <p>
        Comunicações essenciais relacionadas à sua conta (faturas, alertas de segurança, alterações
        nos termos) não podem ser desativadas enquanto a conta estiver ativa, pois são necessárias
        para a prestação do serviço.
      </p>

      {/* 14 */}
      <h2><span className="num">14</span> Links para Sites de Terceiros</h2>
      <p>
        A plataforma pode conter links ou integrações com sites e serviços de terceiros. Ao acessar
        esses serviços, você estará sujeito às políticas de privacidade dos respectivos terceiros.
        O ObrasFlow não se responsabiliza pelo conteúdo, práticas de privacidade ou segurança de
        sites externos.
      </p>

      {/* 15 */}
      <h2><span className="num">15</span> Alterações nesta Política</h2>
      <p>
        Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças nas
        nossas práticas, na legislação ou nas funcionalidades da plataforma. Sempre que houver
        alterações relevantes, notificaremos os usuários com antecedência mínima de 30 (trinta) dias
        por e-mail e/ou aviso dentro da plataforma, antes que as novas práticas entrem em vigor.
      </p>
      <p>
        A versão atualizada sempre ficará disponível em /privacidade. A data de "Última atualização"
        no topo deste documento indica quando houve a última revisão. Recomendamos que você verifique
        esta Política periodicamente.
      </p>

      {/* 16 */}
      <h2><span className="num">16</span> Contato, DPO e Canal de Privacidade</h2>
      <p>
        Para exercer seus direitos, esclarecer dúvidas sobre privacidade, reportar suspeitas de
        violação de dados ou entrar em contato com nosso Encarregado (DPO), utilize:
      </p>
      <ul>
        <li><strong>Plataforma:</strong> Configurações → Segurança e LGPD → Solicitações de Privacidade</li>
        <li><strong>Suporte:</strong> Canal de suporte disponível na plataforma (ícone de ajuda ou área de SAC)</li>
        <li><strong>E-mail:</strong> disponível na área de Contato do site</li>
      </ul>
      <p>
        Todas as solicitações formais devem ser feitas por escrito e serão respondidas dentro do
        prazo legal (até 15 dias corridos). Para petições à autoridade competente:
      </p>
      <div className="info-box">
        <strong>Autoridade Nacional de Proteção de Dados (ANPD):</strong> gov.br/anpd<br />
        Você tem o direito de encaminhar reclamações à ANPD caso entenda que seus direitos foram
        violados e não foram adequadamente tratados pelo ObrasFlow.
      </div>

      <div className="info-box" style={{ marginTop: 32 }}>
        <strong>Versão e histórico:</strong> Esta Política foi criada em 26 de maio de 2026 (Versão 2.0),
        adequada à LGPD (Lei nº 13.709/2018) e ao Marco Civil da Internet (Lei nº 12.965/2014).
        Versões anteriores podem ser solicitadas pelo canal de suporte.
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
