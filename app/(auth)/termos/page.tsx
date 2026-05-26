import Link from "next/link";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export default function TermosPage() {
  return (
    <LegalPageShell
      title="Termos de Uso"
      subtitle="Última atualização: 26 de maio de 2026 · Versão 2.0"
    >
      <div className="highlight-box">
        <strong>Leia com atenção antes de usar a plataforma.</strong> Ao se cadastrar, acessar ou
        utilizar qualquer funcionalidade do ObrasFlow, você declara que leu, compreendeu e concorda
        integralmente com estes Termos de Uso. Se não concordar com qualquer cláusula, não utilize a
        plataforma.
      </div>

      {/* 1 */}
      <h2><span className="num">1</span> Identificação das Partes e da Plataforma</h2>
      <p>
        <strong>ObrasFlow</strong> é uma plataforma de gestão de obras, projetos e equipes de
        construção civil, desenvolvida e operada por seus titulares legais ("ObrasFlow", "nós",
        "nos" ou "nosso"). A plataforma é oferecida exclusivamente via web, no domínio oficial
        da ObrasFlow, e por aplicações integradas devidamente autorizadas.
      </p>
      <p>
        <strong>Usuário</strong>: qualquer pessoa física ou jurídica que acesse, utilize ou se
        cadastre na plataforma, seja como titular de conta ("Controlador"), como colaborador
        convidado ("Membro da Equipe"), ou como visitante das páginas públicas.
      </p>
      <div className="info-box">
        <strong>Contato oficial:</strong> Para questões legais, contratuais ou de suporte, entre em
        contato pelo e-mail disponível na área de Suporte da plataforma ou pela seção de Contato do
        site. Toda comunicação formal deve ser feita por escrito.
      </div>

      {/* 2 */}
      <h2><span className="num">2</span> Definições e Glossário</h2>
      <p>Para fins destes Termos, os termos abaixo têm o seguinte significado:</p>
      <ul>
        <li><strong>Plataforma:</strong> o sistema ObrasFlow, incluindo interface web, APIs, painéis, módulos e funcionalidades disponibilizadas.</li>
        <li><strong>Conta:</strong> conjunto de credenciais e dados que identificam um Usuário na plataforma.</li>
        <li><strong>Conta Master:</strong> conta de uso exclusivo da equipe ObrasFlow para manutenção, suporte técnico e supervisão operacional das contas de clientes. Não é uma conta de cliente.</li>
        <li><strong>Empresa / Tenant:</strong> organização cadastrada na plataforma que representa um cliente contratante. Todos os dados e usuários são isolados por empresa (tenant).</li>
        <li><strong>Controlador da Conta:</strong> usuário administrador responsável legal pela conta da empresa, com permissões de gerenciamento de membros, dados e assinatura.</li>
        <li><strong>Membro da Equipe:</strong> usuário convidado pelo Controlador para acessar funcionalidades específicas dentro do ambiente da empresa.</li>
        <li><strong>Plano:</strong> pacote de funcionalidades contratado: Starter, Pro ou Enterprise.</li>
        <li><strong>Dados do Usuário:</strong> todas as informações, arquivos, registros, fotos, documentos e dados inseridos ou gerados pelo Usuário na plataforma.</li>
        <li><strong>Conteúdo:</strong> qualquer material textual, visual, fotográfico, documental ou de outro tipo inserido ou gerado na plataforma.</li>
        <li><strong>Integração:</strong> conexão da plataforma com serviços de terceiros (Stripe, WhatsApp, etc.) autorizada pelo Usuário.</li>
        <li><strong>LGPD:</strong> Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).</li>
        <li><strong>Marco Civil:</strong> Marco Civil da Internet (Lei nº 12.965/2014).</li>
      </ul>

      {/* 3 */}
      <h2><span className="num">3</span> Aceite dos Termos e Capacidade Civil</h2>
      <p>
        Ao clicar em "Criar Conta", "Aceito os Termos" ou ao simplesmente utilizar a plataforma, o
        Usuário declara expressamente que:
      </p>
      <ul>
        <li>É pessoa física com capacidade civil plena (maior de 18 anos) ou pessoa jurídica regularmente constituída, representada por responsável legal com poderes para contratar;</li>
        <li>Leu, compreendeu e aceita integralmente estes Termos de Uso e a Política de Privacidade;</li>
        <li>As informações fornecidas no cadastro são verdadeiras, atualizadas e completas;</li>
        <li>Está autorizado a agir em nome da empresa cadastrada, caso o cadastro seja realizado em nome de pessoa jurídica;</li>
        <li>Possui autorização legal para inserir os dados, documentos e informações de terceiros que venha a cadastrar na plataforma.</li>
      </ul>
      <p>
        Menores de 18 anos não estão autorizados a utilizar a plataforma de forma independente. Caso
        identifiquemos uso por menor, a conta poderá ser imediatamente suspensa.
      </p>

      {/* 4 */}
      <h2><span className="num">4</span> Cadastro, Conta e Acesso</h2>
      <h3>4.1 Criação de Conta</h3>
      <p>
        O cadastro exige o fornecimento de nome, e-mail válido, senha e dados básicos da empresa. O
        Usuário é o único responsável pela veracidade das informações fornecidas. O ObrasFlow se
        reserva o direito de recusar cadastros, cancelar contas ou exigir verificação adicional a
        qualquer momento, sem necessidade de justificativa prévia.
      </p>
      <h3>4.2 Segurança das Credenciais</h3>
      <p>
        O Usuário é inteiramente responsável pela guarda, sigilo e uso de suas credenciais de acesso
        (e-mail e senha). É expressamente proibido compartilhar credenciais com terceiros não
        autorizados. Em caso de suspeita de acesso não autorizado, o Usuário deve imediatamente
        alterar sua senha e notificar o suporte do ObrasFlow.
      </p>
      <p>
        O ObrasFlow não será responsável por danos decorrentes do uso não autorizado de credenciais
        do Usuário, salvo comprovada falha de segurança da própria plataforma.
      </p>
      <h3>4.3 Limites de Perfis por Plano</h3>
      <p>Cada plano possui um limite de usuários (perfis) ativos por empresa:</p>
      <table>
        <thead>
          <tr><th>Plano</th><th>Perfis inclusos</th><th>Perfis adicionais</th></tr>
        </thead>
        <tbody>
          <tr><td>Starter</td><td>Até 10 perfis</td><td>Não disponível</td></tr>
          <tr><td>Pro</td><td>Até 30 perfis</td><td>Sob consulta</td></tr>
          <tr><td>Enterprise</td><td>80+ perfis</td><td>Sob negociação</td></tr>
        </tbody>
      </table>
      <p>
        Exceder os limites sem contratação adicional poderá resultar na impossibilidade de adicionar
        novos membros ou na suspensão temporária da funcionalidade.
      </p>
      <h3>4.4 Isolamento de Dados por Empresa</h3>
      <p>
        Cada empresa cadastrada possui um ambiente isolado (tenant). Usuários de uma empresa não
        têm acesso, visibilidade ou qualquer interação com dados de outra empresa. Apenas usuários
        membros da mesma empresa podem compartilhar dados e recursos dentro da plataforma.
      </p>

      {/* 5 */}
      <h2><span className="num">5</span> Planos, Preços e Pagamento</h2>
      <h3>5.1 Planos Disponíveis</h3>
      <p>
        O ObrasFlow oferece planos pagos com período de cobrança mensal ou anual. Os planos, recursos
        e preços vigentes estão sempre disponíveis na página de Planos do site e podem ser alterados
        mediante aviso prévio de 30 (trinta) dias ao Usuário.
      </p>
      <h3>5.2 Período de Teste Gratuito</h3>
      <p>
        Poderá ser oferecido período de avaliação gratuita ("trial") conforme condições descritas na
        página de cadastro. Ao final do trial, o acesso será limitado ou encerrado automaticamente,
        salvo contratação de plano pago. Não é cobrado nenhum valor durante o trial, a menos que
        expressamente informado.
      </p>
      <h3>5.3 Cobrança e Renovação</h3>
      <p>
        Os planos são cobrados antecipadamente, por período contratado (mensal ou anual), por meio
        do processador de pagamentos Stripe. A assinatura é renovada automaticamente ao final de
        cada período, salvo cancelamento prévio pelo Usuário conforme cláusula 5.5.
      </p>
      <p>
        O Usuário autoriza a cobrança recorrente no cartão de crédito ou débito cadastrado. Falhas
        de cobrança resultarão em notificação por e-mail e período de carência de até 5 (cinco) dias
        corridos para regularização, após o qual o acesso poderá ser suspenso.
      </p>
      <h3>5.4 Inadimplência</h3>
      <p>
        Em caso de inadimplência: (i) o acesso à plataforma será suspenso após o período de carência;
        (ii) os dados do Usuário serão mantidos por até 90 (noventa) dias após a suspensão; (iii)
        após esse prazo, os dados poderão ser anonimizados ou excluídos definitivamente; (iv) o
        reativamento da conta exige quitação integral dos valores em aberto.
      </p>
      <h3>5.5 Cancelamento pelo Usuário</h3>
      <p>
        O Usuário pode cancelar sua assinatura a qualquer momento pela área de Configurações →
        Assinatura, ou solicitando ao suporte. O cancelamento é efetivo ao final do período já pago,
        sem cobrança adicional. Não há reembolso proporcional por período não utilizado, salvo
        disposição legal em contrário.
      </p>
      <h3>5.6 Política de Reembolso</h3>
      <p>
        Solicitações de reembolso serão analisadas caso a caso. O ObrasFlow poderá conceder reembolso
        integral dentro de 7 (sete) dias corridos a partir da primeira cobrança de um plano, desde
        que o Usuário não tenha feito uso extensivo da plataforma. Após esse prazo, não são concedidos
        reembolsos por períodos parciais não utilizados. Para cobranças indevidas, entre em contato
        com o suporte em até 30 dias da cobrança.
      </p>
      <h3>5.7 Alteração de Plano</h3>
      <p>
        O Usuário pode fazer upgrade de plano a qualquer momento, com efeito imediato e cobrança
        proporcional. Downgrades entram em vigor no próximo ciclo de cobrança. Funcionalidades que
        excedam os limites do novo plano poderão ser desativadas no momento do downgrade.
      </p>

      {/* 6 */}
      <h2><span className="num">6</span> Uso Permitido da Plataforma</h2>
      <p>
        O ObrasFlow é uma ferramenta profissional de gestão de obras e construção civil. O Usuário
        se compromete a utilizá-la exclusivamente para finalidades legítimas, lícitas e relacionadas
        à gestão de projetos de construção, reforma, engenharia e afins.
      </p>
      <h3>6.1 Usos Expressamente Autorizados</h3>
      <ul>
        <li>Gerenciamento de obras, projetos, cronogramas e equipes;</li>
        <li>Registro de diários de obra, medições, vistorias e laudos;</li>
        <li>Controle de materiais, estoque, fornecedores e orçamentos;</li>
        <li>Comunicação interna entre membros da mesma empresa;</li>
        <li>Geração e exportação de relatórios de progresso;</li>
        <li>Gestão de clientes (CRM) e contratos relacionados à atividade da empresa;</li>
        <li>Uso das integrações disponibilizadas (WhatsApp, e-mail, etc.) para fins profissionais.</li>
      </ul>
      <h3>6.2 Usos Expressamente Proibidos</h3>
      <p>
        É terminantemente proibido ao Usuário, sob pena de suspensão imediata e responsabilização
        civil e criminal:
      </p>
      <ul>
        <li>Compartilhar credenciais de acesso ou permitir acesso de pessoas não autorizadas à conta;</li>
        <li>Tentar acessar, alterar ou danificar contas ou dados de outros usuários ou empresas;</li>
        <li>Realizar engenharia reversa, descompilar, desmontar ou tentar extrair o código-fonte da plataforma;</li>
        <li>Utilizar bots, scripts automatizados, scrapers ou qualquer meio automatizado para acessar ou coletar dados da plataforma sem autorização expressa;</li>
        <li>Inserir vírus, malware, ransomware ou qualquer código malicioso na plataforma;</li>
        <li>Realizar ataques de DDoS, força bruta, injeção de SQL ou qualquer tentativa de comprometimento da segurança;</li>
        <li>Utilizar a plataforma para fins ilegais, fraudulentos ou que violem direitos de terceiros;</li>
        <li>Inserir conteúdo que viole direitos autorais, marcas registradas, segredos comerciais ou qualquer propriedade intelectual de terceiros;</li>
        <li>Inserir, armazenar ou transmitir conteúdo ilegal, difamatório, obsceno, discriminatório, racista ou que incite violência;</li>
        <li>Cadastrar dados falsos de empresas, obras ou pessoas para obter benefícios indevidos;</li>
        <li>Revender, sublicenciar, alugar ou transferir o acesso à plataforma para terceiros sem autorização;</li>
        <li>Contornar medidas de segurança, autenticação ou controle de acesso da plataforma;</li>
        <li>Realizar mineração de dados (data mining) ou coleta massiva de informações da plataforma;</li>
        <li>Utilizar a plataforma de maneira que sobrecarregue desproporcionalmente a infraestrutura.</li>
      </ul>
      <div className="highlight-box">
        A violação de qualquer proibição listada acima autoriza o ObrasFlow a suspender ou encerrar
        imediatamente a conta, sem aviso prévio e sem direito a reembolso, além de tomar as medidas
        legais cabíveis, incluindo notificação de autoridades competentes.
      </div>

      {/* 7 */}
      <h2><span className="num">7</span> Conteúdo do Usuário e Responsabilidade</h2>
      <h3>7.1 Propriedade do Conteúdo</h3>
      <p>
        O Usuário mantém todos os direitos de propriedade sobre os dados, documentos, fotos e demais
        conteúdos que inserir na plataforma. O ObrasFlow não reivindica propriedade sobre o conteúdo
        do Usuário.
      </p>
      <h3>7.2 Licença de Uso</h3>
      <p>
        Ao inserir conteúdo na plataforma, o Usuário concede ao ObrasFlow uma licença não-exclusiva,
        gratuita, mundial e pelo tempo necessário para: (i) armazenar, processar e exibir o conteúdo
        ao próprio Usuário e seus membros autorizados; (ii) realizar backups e garantir a segurança
        dos dados; (iii) melhorar o funcionamento da plataforma de forma agregada e anonimizada.
        Esta licença não autoriza o ObrasFlow a comercializar, publicar ou divulgar o conteúdo do
        Usuário a terceiros.
      </p>
      <h3>7.3 Responsabilidade pelo Conteúdo</h3>
      <p>
        O Usuário é o único e exclusivo responsável por todo o conteúdo que inserir na plataforma,
        incluindo fotos, documentos, dados de terceiros, medições, laudos e comunicações. O ObrasFlow
        não monitora, edita, aprova ou endossa o conteúdo dos usuários, mas se reserva o direito de
        remover conteúdo ilegal ou que viole estes Termos.
      </p>
      <h3>7.4 Dados de Terceiros</h3>
      <p>
        Ao inserir dados pessoais de terceiros (funcionários, clientes, fornecedores, etc.), o Usuário
        declara que: (i) possui base legal adequada para o tratamento desses dados (consentimento,
        obrigação legal, legítimo interesse, etc.); (ii) coletou tais dados de forma lícita; (iii)
        informou os titulares sobre o tratamento conforme exigido pela LGPD.
      </p>

      {/* 8 */}
      <h2><span className="num">8</span> Propriedade Intelectual do ObrasFlow</h2>
      <p>
        Todos os elementos da plataforma ObrasFlow — incluindo, mas não se limitando a: marca, logo,
        identidade visual, design, interface, código-fonte, banco de dados, algoritmos, funcionalidades,
        documentação, textos, ícones, relatórios padrão e qualquer outro elemento original — são de
        propriedade exclusiva do ObrasFlow ou de seus licenciadores, e estão protegidos pelas leis
        brasileiras e internacionais de propriedade intelectual.
      </p>
      <p>
        O uso da plataforma não transfere ao Usuário nenhum direito de propriedade intelectual. É
        expressamente proibido copiar, reproduzir, adaptar, modificar, distribuir, publicar ou criar
        obras derivadas com base em qualquer elemento da plataforma sem autorização expressa e prévia
        por escrito do ObrasFlow.
      </p>

      {/* 9 */}
      <h2><span className="num">9</span> Disponibilidade, Manutenção e Atualizações</h2>
      <h3>9.1 Disponibilidade</h3>
      <p>
        O ObrasFlow envidar seus melhores esforços para manter a plataforma disponível 24 (vinte e
        quatro) horas por dia, 7 (sete) dias por semana. Contudo, não garantimos disponibilidade
        ininterrupta, e não nos responsabilizamos por interrupções causadas por: (i) manutenções
        programadas; (ii) falhas de infraestrutura de terceiros (provedores de nuvem, CDN, etc.);
        (iii) eventos de força maior; (iv) ataques cibernéticos; (v) falhas de conectividade fora
        de nosso controle.
      </p>
      <h3>9.2 Manutenções</h3>
      <p>
        Manutenções programadas serão comunicadas com antecedência mínima de 24 horas por e-mail ou
        aviso dentro da plataforma, sempre que possível. Manutenções de emergência podem ocorrer
        sem aviso prévio.
      </p>
      <h3>9.3 Atualizações e Evolução</h3>
      <p>
        O ObrasFlow poderá, a qualquer tempo: (i) adicionar, modificar ou remover funcionalidades;
        (ii) alterar a interface da plataforma; (iii) migrar para novas tecnologias; (iv) encerrar
        módulos ou integrações com pré-aviso adequado. Mudanças que impliquem redução significativa
        de funcionalidades contratadas serão comunicadas com no mínimo 30 dias de antecedência.
      </p>

      {/* 10 */}
      <h2><span className="num">10</span> Suspensão e Encerramento de Conta</h2>
      <h3>10.1 Suspensão por Violação</h3>
      <p>
        O ObrasFlow poderá suspender ou encerrar imediatamente qualquer conta, sem aviso prévio, nos
        seguintes casos:
      </p>
      <ul>
        <li>Violação de qualquer cláusula destes Termos de Uso;</li>
        <li>Inadimplência após período de carência;</li>
        <li>Uso da plataforma para fins ilegais ou fraudulentos;</li>
        <li>Atividades que coloquem em risco a segurança da plataforma ou de outros usuários;</li>
        <li>Determinação judicial ou de autoridade competente;</li>
        <li>Suspeita fundada de violação de propriedade intelectual ou privacidade de terceiros.</li>
      </ul>
      <h3>10.2 Encerramento pelo Usuário</h3>
      <p>
        O Usuário pode solicitar o encerramento de sua conta a qualquer momento. Após o encerramento:
        (i) o acesso é imediatamente revogado; (ii) os dados são mantidos por 90 dias para fins de
        backup e eventual reativação; (iii) após esse prazo, os dados são excluídos ou anonimizados
        de forma irreversível; (iv) obrigações financeiras pendentes continuam exigíveis.
      </p>
      <h3>10.3 Exportação de Dados Antes do Encerramento</h3>
      <p>
        Recomendamos fortemente que o Usuário exporte seus dados antes de solicitar o encerramento
        da conta. A plataforma oferece ferramentas de exportação de dados na área de Configurações.
        O ObrasFlow não se responsabiliza pela perda de dados após o prazo de 90 dias.
      </p>

      {/* 11 */}
      <h2><span className="num">11</span> Limitação de Responsabilidade</h2>
      <p>
        Na máxima extensão permitida pela legislação aplicável, o ObrasFlow não se responsabiliza
        por danos indiretos, incidentais, especiais, punitivos ou consequenciais, incluindo:
      </p>
      <ul>
        <li>Perda de lucros, receita ou negócios;</li>
        <li>Perda ou corrupção de dados causada por falha do Usuário em realizar backups;</li>
        <li>Danos causados por uso inadequado da plataforma;</li>
        <li>Decisões tomadas com base em informações geradas pela plataforma;</li>
        <li>Erros, omissões ou imprecisões em relatórios ou cálculos gerados pelo sistema, quando derivados de dados incorretos inseridos pelo Usuário;</li>
        <li>Danos causados por terceiros que obtiveram acesso não autorizado usando credenciais do Usuário;</li>
        <li>Indisponibilidade da plataforma por causas fora de nosso controle razoável.</li>
      </ul>
      <p>
        A responsabilidade total do ObrasFlow perante o Usuário, em qualquer hipótese, fica limitada
        ao valor pago pelo Usuário nos últimos 3 (três) meses de assinatura.
      </p>
      <div className="info-box">
        <strong>Aviso importante:</strong> O ObrasFlow é uma ferramenta de apoio à gestão. Decisões
        técnicas, estruturais, financeiras e de segurança relacionadas às obras são de responsabilidade
        exclusiva dos profissionais habilitados (engenheiros, arquitetos, mestres de obras, etc.) e
        do Usuário. A plataforma não substitui laudos técnicos, ARTs ou responsabilidades profissionais.
      </div>

      {/* 12 */}
      <h2><span className="num">12</span> Integrações com Serviços de Terceiros</h2>
      <p>
        A plataforma pode oferecer integrações com serviços de terceiros (Stripe para pagamentos,
        WhatsApp Business, serviços de e-mail, armazenamento em nuvem, etc.). Ao utilizar uma
        integração, o Usuário está sujeito também aos termos de uso e políticas de privacidade
        do respectivo serviço de terceiro.
      </p>
      <p>
        O ObrasFlow não se responsabiliza por: (i) falhas nos serviços de terceiros; (ii) alterações
        nas APIs ou políticas dos serviços integrados; (iii) cobranças realizadas diretamente pelos
        serviços de terceiros; (iv) tratamento de dados realizado pelos terceiros em suas próprias
        plataformas.
      </p>

      {/* 13 */}
      <h2><span className="num">13</span> Confidencialidade</h2>
      <p>
        O ObrasFlow trata as informações do Usuário como confidenciais e se compromete a não
        divulgá-las a terceiros, exceto: (i) com a expressa autorização do Usuário; (ii) quando
        exigido por lei, decisão judicial ou autoridade competente; (iii) para prestadores de
        serviço contratados pelo ObrasFlow que necessitem do acesso para a prestação dos serviços,
        sujeitos a acordos de confidencialidade equivalentes.
      </p>
      <p>
        O Usuário, por sua vez, compromete-se a manter em sigilo quaisquer informações técnicas,
        comerciais ou operacionais do ObrasFlow às quais tenha acesso em razão do uso da plataforma,
        que não sejam de domínio público.
      </p>

      {/* 14 */}
      <h2><span className="num">14</span> Segurança da Plataforma</h2>
      <p>O ObrasFlow adota múltiplas camadas de segurança para proteger os dados dos usuários, incluindo:</p>
      <ul>
        <li>Criptografia em trânsito (TLS/HTTPS) em todas as comunicações;</li>
        <li>Criptografia AES-256 em repouso para dados sensíveis;</li>
        <li>Controle de acesso granular por perfil e função;</li>
        <li>Isolamento de dados por tenant (empresa);</li>
        <li>Monitoramento contínuo de acessos e atividades suspeitas;</li>
        <li>Backups periódicos automatizados;</li>
        <li>Autenticação com suporte a múltiplos fatores.</li>
      </ul>
      <p>
        Apesar dos investimentos em segurança, nenhum sistema é 100% inviolável. O Usuário deve
        adotar boas práticas de segurança, como uso de senhas fortes, não reutilização de senhas e
        vigilância sobre tentativas de phishing. Vulnerabilidades identificadas devem ser reportadas
        imediatamente ao suporte.
      </p>

      {/* 15 */}
      <h2><span className="num">15</span> Comunicações e Notificações</h2>
      <p>
        O Usuário concorda em receber comunicações do ObrasFlow por e-mail e por notificações dentro
        da plataforma, incluindo: avisos sobre a conta, faturas, alterações nos termos, novidades
        e comunicações de suporte. Comunicações de natureza contratual e legal são obrigatórias e
        não podem ser desativadas. Comunicações de marketing podem ser desativadas nas preferências
        da conta.
      </p>
      <p>
        O Usuário é responsável por manter seu e-mail de cadastro atualizado e válido. O ObrasFlow
        não se responsabiliza por comunicações não recebidas em razão de e-mail desatualizado,
        inativo ou com filtros de spam.
      </p>

      {/* 16 */}
      <h2><span className="num">16</span> Alterações nestes Termos</h2>
      <p>
        O ObrasFlow se reserva o direito de modificar estes Termos de Uso a qualquer momento.
        Alterações materiais serão comunicadas com antecedência mínima de 30 (trinta) dias por
        e-mail e/ou aviso destacado na plataforma. Alterações de menor relevância (correções
        gramaticais, esclarecimentos sem impacto ao Usuário) poderão ser realizadas sem aviso
        prévio.
      </p>
      <p>
        O uso continuado da plataforma após a data de vigência das alterações implica aceitação
        automática dos novos Termos. Caso o Usuário não concorde com as alterações, deve cessar o
        uso da plataforma e solicitar o cancelamento de sua conta antes da data de vigência.
      </p>

      {/* 17 */}
      <h2><span className="num">17</span> Disposições Gerais</h2>
      <h3>17.1 Integralidade</h3>
      <p>
        Estes Termos, juntamente com a Política de Privacidade e demais documentos incorporados por
        referência, constituem o acordo integral entre o Usuário e o ObrasFlow, substituindo quaisquer
        acordos ou entendimentos anteriores sobre o mesmo objeto.
      </p>
      <h3>17.2 Renúncia</h3>
      <p>
        A falha do ObrasFlow em exercer qualquer direito previsto nestes Termos não constitui renúncia
        a esse direito. Qualquer renúncia deve ser feita expressamente e por escrito.
      </p>
      <h3>17.3 Invalidade Parcial</h3>
      <p>
        Caso qualquer cláusula destes Termos seja declarada inválida ou inexequível por decisão
        judicial, as demais cláusulas permanecerão em pleno vigor e efeito.
      </p>
      <h3>17.4 Cessão</h3>
      <p>
        O Usuário não pode ceder ou transferir seus direitos ou obrigações decorrentes destes Termos
        sem prévia autorização escrita do ObrasFlow. O ObrasFlow pode ceder estes Termos em caso de
        fusão, aquisição ou venda de ativos, notificando o Usuário com antecedência razoável.
      </p>
      <h3>17.5 Força Maior</h3>
      <p>
        O ObrasFlow não será responsabilizado por descumprimento de obrigações causado por eventos
        de força maior ou caso fortuito, conforme definido no art. 393 do Código Civil Brasileiro,
        incluindo desastres naturais, guerras, pandemias, greves, falhas massivas de infraestrutura
        de internet e ações governamentais.
      </p>

      {/* 18 */}
      <h2><span className="num">18</span> Lei Aplicável e Foro</h2>
      <p>
        Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil, em especial
        pela Lei nº 10.406/2002 (Código Civil), Lei nº 12.965/2014 (Marco Civil da Internet),
        Lei nº 13.709/2018 (LGPD), e demais normas aplicáveis.
      </p>
      <p>
        Para a resolução de qualquer disputa decorrente destes Termos, fica eleito o foro da comarca
        de domicílio do Usuário, conforme art. 22, §2º, da Lei nº 12.965/2014 (Marco Civil da
        Internet), com renúncia expressa a qualquer outro, por mais privilegiado que seja.
      </p>
      <p>
        Antes de recorrer ao Poder Judiciário, as partes comprometem-se a buscar, de boa-fé,
        solução amigável para eventuais conflitos, por meio do canal de suporte do ObrasFlow.
      </p>

      <div className="info-box" style={{ marginTop: 32 }}>
        <strong>Versão e histórico:</strong> Este documento foi criado em 26 de maio de 2026 (Versão 2.0).
        O histórico de versões anteriores pode ser solicitado pelo suporte.
        Para dúvidas sobre estes Termos, entre em contato com nossa equipe pelo canal de suporte
        disponível na plataforma.
      </div>

      <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" as const }}>
        <Link href="/privacidade" className="of-btn-secondary" style={{ display: "inline-block" }}>
          Ver Política de Privacidade
        </Link>
        <Link href="/cadastro" className="of-btn-primary" style={{ display: "inline-block" }}>
          Voltar ao cadastro
        </Link>
      </div>
    </LegalPageShell>
  );
}
