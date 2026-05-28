import Link from "next/link";
import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Termos de uso — ObrasCitY",
  description:
    "Leia os Termos de Uso da ObrasCitY: regras de contratação, responsabilidades, pagamentos e uso da plataforma.",
  alternates: {
    canonical: "/termos",
  },
};

export default function TermosPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Termos de uso — ObrasCitY",
    url: "https://obrascity.com.br/termos",
    inLanguage: "pt-BR",
    isPartOf: {
      "@type": "WebSite",
      name: "ObrasCitY",
      url: "https://obrascity.com.br",
    },
    publisher: {
      "@type": "Organization",
      name: "ObrasCitY",
      url: "https://obrascity.com.br",
    },
  };

  return (
    <LegalPageShell
      title="Termos de Uso"
      subtitle="Última atualização: 26 de maio de 2026 · Versão 3.0 · Leitura estimada: 25 minutos"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="highlight-box">
        <strong>📋 Por que você precisa ler isso?</strong><br />
        Estes Termos de Uso formam um contrato legal entre você (ou a empresa que você representa)
        e o ObrasCitY. Eles definem os direitos e obrigações de ambas as partes, o que é permitido
        fazer na plataforma, o que é proibido, como funciona o pagamento, o que acontece em caso de
        problemas e muito mais.<br /><br />
        <strong>Ao clicar em "Criar Conta", "Aceito os Termos" ou ao simplesmente utilizar qualquer
        funcionalidade do ObrasCitY, você declara, sob sua responsabilidade, que:</strong>
        <ul style={{ marginTop: 8 }}>
          <li>Leu e compreendeu integralmente este documento;</li>
          <li>Concorda com todas as regras aqui estabelecidas;</li>
          <li>Tem capacidade legal para celebrar este contrato.</li>
        </ul>
        Se não concordar com qualquer parte destes Termos, por favor, não utilize a plataforma.
      </div>

      {/* 1 */}
      <h2><span className="num">1</span> Quem Somos — Identificação das Partes</h2>
      <p>
        O <strong>ObrasCitY</strong> é uma plataforma digital especializada em gestão de obras,
        projetos de construção civil, controle de equipes e acompanhamento de indicadores de
        performance para o setor da construção. A plataforma é desenvolvida, mantida e operada por
        seus titulares legais, doravante denominados simplesmente "<strong>ObrasCitY</strong>",
        "<strong>nós</strong>", "<strong>nos</strong>" ou "<strong>nosso</strong>".
      </p>
      <div className="info-box">
        <strong>Identificação legal e contato:</strong><br />
        Marca: ObrasCitY.<br />
        Razão social e CNPJ: sob responsabilidade do titular da conta empresarial e publicados no canal oficial de contato jurídico do site.<br />
        Contato jurídico: <strong>juridico@obrascity.com.br</strong>.
      </div>
      <p>
        A plataforma é acessível exclusivamente por meio do domínio oficial do ObrasCitY na internet,
        e por aplicativos ou integrações devidamente autorizados e divulgados em nosso site. Qualquer
        versão não oficial da plataforma deve ser imediatamente reportada ao nosso suporte.
      </p>
      <p>
        <strong>Você, o Usuário</strong>, é qualquer pessoa física maior de 18 anos ou pessoa jurídica
        regularmente constituída que acesse, navegue, se cadastre ou utilize qualquer funcionalidade
        da plataforma ObrasCitY — seja como responsável pela conta da empresa, como membro convidado
        da equipe, ou como visitante das páginas públicas do site.
      </p>
      <div className="info-box">
        <strong>📬 Como nos contatar formalmente?</strong><br />
        Para questões legais, contratuais, reclamações formais ou solicitações que exijam resposta
        por escrito, utilize o canal de suporte oficial disponível dentro da plataforma (ícone de
        ajuda ou área de SAC) ou pelo e-mail disponível na seção de Contato do site.<br /><br />
        <strong>Importante:</strong> Toda e qualquer comunicação com efeito legal deve ser feita
        por escrito e de forma documentada. Comunicações verbais ou por redes sociais não têm valor
        contratual.
      </div>

      {/* 2 */}
      <h2><span className="num">2</span> Glossário — O Que Significa Cada Termo</h2>
      <p>
        Para evitar dúvidas de interpretação, explicamos abaixo o significado exato de cada termo
        técnico ou jurídico utilizado ao longo deste documento. Sempre que esses termos aparecerem
        com inicial maiúscula, estamos nos referindo às definições abaixo:
      </p>
      <ul>
        <li>
          <strong>Plataforma:</strong> O sistema ObrasCitY como um todo — incluindo a interface web
          acessível pelo navegador, os painéis de controle, todos os módulos de funcionalidades
          (diário de obra, relatórios, financeiro, etc.), as APIs de integração e qualquer
          outra ferramenta disponibilizada pelo ObrasCitY, seja ela gratuita ou paga.
        </li>
        <li>
          <strong>Conta:</strong> O conjunto formado pelas credenciais de acesso (e-mail e senha),
          pelas informações de perfil e por todos os dados associados a um determinado Usuário dentro
          da plataforma. Cada pessoa física deve possuir apenas uma conta.
        </li>
        <li>
          <strong>Conta Master:</strong> Conta de uso <em>exclusivo</em> da equipe técnica do
          ObrasCitY. Esta conta serve para manutenção do sistema, suporte técnico avançado,
          monitoramento de funcionamento da plataforma e auxílio aos clientes quando solicitado.
          A Conta Master <strong>não é uma conta de cliente</strong> e não está sujeita às mesmas
          regras de planos e assinaturas dos demais usuários.
        </li>
        <li>
          <strong>Empresa / Tenant:</strong> Cada empresa cliente do ObrasCitY possui um ambiente
          totalmente isolado dentro da plataforma, chamado de "tenant". Isso significa que todos os
          dados, usuários, projetos e configurações de uma empresa ficam completamente separados dos
          dados de qualquer outra empresa. Usuários de empresas diferentes não se enxergam e não
          têm acesso aos dados uns dos outros.
        </li>
        <li>
          <strong>Controlador da Conta (Admin):</strong> O usuário com perfil de administrador
          dentro da empresa. É o responsável legal pela conta, pelo pagamento da assinatura, pelo
          gerenciamento dos membros da equipe e pela conformidade do uso da plataforma dentro da
          organização. Cada empresa pode ter um ou mais administradores, conforme o plano contratado.
        </li>
        <li>
          <strong>Membro da Equipe:</strong> Usuário convidado pelo Controlador da Conta para
          acessar funcionalidades específicas dentro do ambiente da empresa. Os membros têm
          permissões limitadas, definidas pelo Controlador, e não podem gerenciar a assinatura ou
          excluir a conta da empresa.
        </li>
        <li>
          <strong>Plano:</strong> O pacote de funcionalidades e limites contratado pela empresa.
          Atualmente, o ObrasCitY oferece três planos: <strong>Starter</strong>,
          <strong>Pro</strong> e <strong>Enterprise</strong>. Cada plano possui características,
          limites e preços diferentes, descritos na página de Planos do site.
        </li>
        <li>
          <strong>Dados do Usuário:</strong> Todas as informações, arquivos, textos, imagens,
          fotografias, vídeos, documentos, planilhas, medições, contratos, registros de diário de
          obra, dados financeiros e qualquer outro conteúdo inserido, carregado ou gerado pelo
          Usuário na plataforma. Esses dados pertencem ao Usuário, não ao ObrasCitY.
        </li>
        <li>
          <strong>Conteúdo:</strong> Termo mais amplo que abrange qualquer material de qualquer
          natureza inserido ou gerado na plataforma, incluindo os Dados do Usuário e também
          qualquer conteúdo de terceiros eventualmente incluído pelo Usuário.
        </li>
        <li>
          <strong>Integração:</strong> Conexão técnica entre o ObrasCitY e um serviço externo
          (como Stripe para pagamentos, WhatsApp Business para comunicação, etc.) ativada e
          autorizada pelo Usuário. Ao ativar uma integração, parte dos dados pode transitar pelo
          serviço externo, que possui seus próprios termos de uso.
        </li>
        <li>
          <strong>Período de Carência:</strong> Prazo concedido ao Usuário para regularizar uma
          situação (como inadimplência) antes de sofrer consequências como suspensão de acesso.
        </li>
        <li>
          <strong>LGPD:</strong> Lei Geral de Proteção de Dados Pessoais, Lei Federal nº 13.709,
          de 14 de agosto de 2018. É a principal lei brasileira que regula o tratamento de dados
          pessoais. Consulte nossa Política de Privacidade para entender como a LGPD se aplica ao
          ObrasCitY.
        </li>
        <li>
          <strong>Marco Civil da Internet:</strong> Lei Federal nº 12.965, de 23 de abril de 2014.
          Estabelece princípios, garantias, direitos e deveres para o uso da internet no Brasil.
        </li>
        <li>
          <strong>Código Civil:</strong> Lei Federal nº 10.406, de 10 de janeiro de 2002. Regula
          as relações contratuais, a responsabilidade civil e a capacidade das partes para celebrar
          contratos no Brasil.
        </li>
        <li>
          <strong>ANPD:</strong> Autoridade Nacional de Proteção de Dados. Órgão federal responsável
          por fiscalizar o cumprimento da LGPD no Brasil. Site: gov.br/anpd.
        </li>
      </ul>

      {/* 3 */}
      <h2><span className="num">3</span> Aceite dos Termos — Quem Pode Usar a Plataforma</h2>
      <h3>3.1 Capacidade Civil</h3>
      <p>
        Para utilizar o ObrasCitY, você precisa ter <strong>capacidade civil plena</strong>. Em
        termos simples, isso significa:
      </p>
      <ul>
        <li>
          Se você é <strong>pessoa física</strong>: precisa ter pelo menos 18 (dezoito) anos de
          idade completos e não pode estar sob curatela ou outra medida que limite sua capacidade
          de contratar;
        </li>
        <li>
          Se você está <strong>representando uma empresa (pessoa jurídica)</strong>: precisa ser
          o sócio, diretor, procurador ou funcionário com poderes suficientes para contratar em
          nome dessa empresa. Ao se cadastrar em nome de uma empresa, você declara que possui esses
          poderes e que a empresa ficará vinculada a estes Termos.
        </li>
      </ul>
      <h3>3.2 Declarações ao Aceitar os Termos</h3>
      <p>
        Ao utilizar a plataforma, você declara expressamente, assumindo responsabilidade legal por
        estas declarações, que:
      </p>
      <ul>
        <li>
          Tem idade igual ou superior a 18 anos (ou a maioridade legal em sua jurisdição, o que
          for maior);
        </li>
        <li>
          Leu, entendeu e concorda integralmente com estes Termos de Uso e com a Política de
          Privacidade do ObrasCitY;
        </li>
        <li>
          Todas as informações fornecidas no cadastro são verdadeiras, corretas, atualizadas e
          completas. Cadastros com informações falsas poderão ser cancelados sem aviso prévio;
        </li>
        <li>
          Caso esteja cadastrando uma empresa, você tem autoridade legal para agir em nome dela e
          vinculá-la a estes Termos;
        </li>
        <li>
          Possui toda a autorização necessária para inserir na plataforma quaisquer dados, documentos
          ou informações de terceiros (funcionários, clientes, fornecedores, parceiros, etc.),
          especialmente quando esses dados forem pessoais;
        </li>
        <li>
          Não utilizará a plataforma para finalidades ilegais, fraudulentas ou prejudiciais a
          terceiros;
        </li>
        <li>
          Não está proibido de utilizar o ObrasCitY por qualquer decisão judicial, administrativa
          ou contratual vigente.
        </li>
      </ul>
      <h3>3.3 Menores de Idade</h3>
      <p>
        O ObrasCitY é uma ferramenta profissional e não é destinado, em nenhuma hipótese, a
        menores de 18 (dezoito) anos. Não coletamos intencionalmente dados de menores e não
        permitimos que eles utilizem a plataforma de forma independente. Caso identifiquemos uma
        conta cadastrada por menor de idade, ela será imediatamente suspensa e os dados excluídos.
      </p>
      <p>
        Se você é responsável legal por um menor e suspeita que ele criou uma conta, entre em
        contato com nosso suporte imediatamente para que possamos tomar as providências cabíveis.
      </p>

      {/* 4 */}
      <h2><span className="num">4</span> Cadastro, Conta e Acesso à Plataforma</h2>
      <h3>4.1 Como Criar uma Conta</h3>
      <p>
        Para ter acesso às funcionalidades do ObrasCitY, é necessário criar uma conta. O processo
        de cadastro exige o fornecimento de, no mínimo: nome completo, endereço de e-mail válido
        e ativo, senha segura e informações básicas sobre a empresa (razão social ou nome
        fantasia). Dados adicionais podem ser solicitados conforme o plano contratado.
      </p>
      <p>
        O ObrasCitY se reserva o direito de, a qualquer momento e sem necessidade de justificativa
        prévia: (i) recusar novos cadastros; (ii) solicitar informações adicionais de verificação;
        (iii) suspender o processamento de um cadastro enquanto analisa sua conformidade com estes
        Termos.
      </p>
      <h3>4.2 E-mail de Cadastro</h3>
      <p>
        O endereço de e-mail informado no cadastro é o principal canal de comunicação com você.
        Por isso, é fundamental que seja um e-mail: (i) de sua propriedade; (ii) ativo e
        monitorado regularmente; (iii) mantido atualizado em seu perfil. Notificações importantes
        sobre sua conta (faturas, alertas de segurança, alterações nos Termos, etc.) serão enviadas
        para esse endereço. O ObrasCitY não se responsabiliza por problemas decorrentes de e-mail
        desatualizado, inativo, com caixa cheia ou com filtros de spam muito restritivos.
      </p>
      <h3>4.3 Segurança das Credenciais — Responsabilidade Total do Usuário</h3>
      <p>
        A senha da sua conta é de <strong>sua responsabilidade exclusiva</strong>. O ObrasCitY
        jamais pedirá sua senha por e-mail, telefone, WhatsApp, chat ou qualquer outro canal.
        Se alguém solicitar sua senha alegando ser do ObrasCitY, trate isso como uma tentativa de
        fraude (phishing) e nos reporte imediatamente.
      </p>
      <p>Para manter sua conta segura, recomendamos:</p>
      <ul>
        <li>Use uma senha longa (mínimo 12 caracteres), com letras maiúsculas e minúsculas, números e símbolos;</li>
        <li>Não reutilize a senha do ObrasCitY em outros serviços;</li>
        <li>Não compartilhe sua senha com ninguém, nem com colegas de trabalho;</li>
        <li>Ative a autenticação em dois fatores (2FA) quando disponível;</li>
        <li>Não acesse a plataforma de redes Wi-Fi públicas sem VPN;</li>
        <li>Faça logout ao término de cada sessão, especialmente em dispositivos compartilhados.</li>
      </ul>
      <p>
        <strong>O Usuário é inteiramente responsável por qualquer ação realizada na plataforma
        a partir de suas credenciais</strong>, seja por ele mesmo ou por terceiros que tenham
        obtido acesso devido a negligência na guarda das credenciais. Em caso de suspeita de acesso
        não autorizado, altere imediatamente sua senha e notifique o suporte.
      </p>
      <h3>4.4 Uma Conta por Pessoa</h3>
      <p>
        Cada pessoa física deve manter apenas uma conta no ObrasCitY. A criação de múltiplas contas
        com o objetivo de burlar limitações de planos, obter períodos de trial repetidos ou por
        qualquer outra razão é expressamente proibida e pode resultar no bloqueio de todas as contas
        identificadas.
      </p>
      <h3>4.5 Isolamento de Dados por Empresa (Tenant)</h3>
      <p>
        Este é um dos pilares de segurança do ObrasCitY. Cada empresa cadastrada existe em um
        ambiente completamente isolado — chamado de "tenant" — dentro da plataforma. Isso significa,
        na prática, que:
      </p>
      <ul>
        <li>Um usuário da Empresa A <strong>jamais verá</strong> os dados, projetos, clientes ou qualquer informação da Empresa B;</li>
        <li>Projetos, obras, equipes, documentos, diários, orçamentos e relatórios são exclusivos de cada empresa;</li>
        <li>Somente usuários que foram explicitamente convidados pelo Controlador da Conta de uma empresa podem acessar o ambiente dessa empresa;</li>
        <li>O isolamento é garantido tanto na camada de interface como na camada de banco de dados.</li>
      </ul>
      <div className="highlight-box">
        <strong>O isolamento de dados é total e automático.</strong> Você não precisa configurar
        nada — por padrão, os dados da sua empresa são privados e acessíveis apenas pelos membros
        da sua equipe que você mesmo autorizar.
      </div>
      <h3>4.6 Limites de Usuários por Plano</h3>
      <p>
        Cada plano do ObrasCitY permite um número máximo de usuários (perfis) ativos
        simultaneamente dentro da conta da empresa:
      </p>
      <table>
        <thead>
          <tr><th>Plano</th><th>Perfis incluídos</th><th>Perfis adicionais</th><th>Observação</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Starter</strong></td>
            <td>Até 10 perfis</td>
            <td>Não disponível</td>
            <td>Ideal para equipes pequenas e médias obras</td>
          </tr>
          <tr>
            <td><strong>Pro</strong></td>
            <td>Até 30 perfis</td>
            <td>Sob consulta</td>
            <td>Para empresas em crescimento com múltiplos projetos</td>
          </tr>
          <tr>
            <td><strong>Enterprise</strong></td>
            <td>80+ perfis</td>
            <td>Sob negociação</td>
            <td>Para grandes construtoras e incorporadoras</td>
          </tr>
        </tbody>
      </table>
      <p>
        Um "perfil ativo" é qualquer conta de usuário que não esteja desativada no painel de
        administração. Usuários desativados não consomem a cota do plano. Ao atingir o limite de
        perfis do seu plano, não será possível convidar novos membros sem fazer upgrade para um
        plano superior ou desativar usuários existentes.
      </p>

      {/* 5 */}
      <h2><span className="num">5</span> Planos, Preços, Pagamentos e Assinatura</h2>
      <h3>5.1 Visão Geral dos Planos</h3>
      <p>
        O ObrasCitY é um serviço pago, oferecido por meio de assinaturas recorrentes (mensais ou
        anuais). Os planos disponíveis, com suas funcionalidades e preços vigentes, estão sempre
        descritos na página de Planos do site. Recomendamos consultar essa página antes de
        contratar para entender exatamente o que está incluído em cada plano.
      </p>
      <p>
        Os preços exibidos no site são em Reais (BRL) e incluem todos os impostos aplicáveis à
        prestação de serviço de software, salvo indicação em contrário. O ObrasCitY pode oferecer
        descontos, cupons ou condições especiais a seu exclusivo critério, válidos apenas durante
        o período informado.
      </p>
      <h3>5.2 Período de Avaliação Gratuita (Trial)</h3>
      <p>
        O ObrasCitY pode oferecer um período de avaliação gratuita ("trial") para novos
        cadastros, conforme descrito na página de cadastro no momento da criação da conta. Durante
        o trial:
      </p>
      <ul>
        <li>Você tem acesso às funcionalidades do plano selecionado sem pagar nada;</li>
        <li>Não é necessário cadastrar cartão de crédito para iniciar o trial (salvo exceções informadas no momento do cadastro);</li>
        <li>Ao final do trial, o acesso será automaticamente limitado ou encerrado, e você receberá um aviso por e-mail para escolher um plano pago;</li>
        <li>Os dados inseridos durante o trial são mantidos por 30 dias após o encerramento para o caso de você decidir contratar;</li>
        <li>Não há renovação automática com cobrança ao final do trial, a menos que você tenha cadastrado um método de pagamento e concordado expressamente com a cobrança automática.</li>
      </ul>
      <h3>5.3 Como Funciona a Cobrança</h3>
      <p>
        Após contratar um plano pago, a cobrança ocorre da seguinte forma:
      </p>
      <ul>
        <li>
          <strong>Cobrança antecipada:</strong> O valor do período (mensal ou anual) é cobrado
          integralmente no início de cada ciclo, antes do início do período de uso;
        </li>
        <li>
          <strong>Renovação automática:</strong> A assinatura renova automaticamente ao final de
          cada período (mensal ou anual), até que você cancele. O cancelamento deve ser feito
          antes da data de renovação para evitar a cobrança do próximo período;
        </li>
        <li>
          <strong>Processamento de pagamento:</strong> Todos os pagamentos são processados pela
          Stripe, plataforma certificada PCI-DSS nível 1. O ObrasCitY não armazena dados de
          cartão de crédito em seus servidores — esses dados ficam exclusivamente na Stripe;
        </li>
        <li>
          <strong>Métodos de pagamento aceitos:</strong> cartão de crédito e débito das principais
          bandeiras. Outros métodos podem estar disponíveis conforme a região e o plano;
        </li>
        <li>
          <strong>Fatura:</strong> Uma fatura eletrônica será enviada para o e-mail da conta após
          cada cobrança bem-sucedida. Faturas também podem ser consultadas no painel de
          Configurações → Assinatura.
        </li>
      </ul>
      <h3>5.4 Falha no Pagamento e Inadimplência</h3>
      <p>
        Se uma cobrança falhar (cartão expirado, saldo insuficiente, bloqueio do banco, etc.),
        o seguinte processo ocorrerá:
      </p>
      <ul>
        <li><strong>Dia 1:</strong> Tentativa de cobrança falhou → notificação automática por e-mail informando o problema e orientando sobre como resolver;</li>
        <li><strong>Dias 1–5:</strong> Período de carência de 5 dias corridos para regularização. Durante esse período, o acesso à plataforma continua normalmente;</li>
        <li><strong>Dias 2, 3 e 5:</strong> Novas tentativas automáticas de cobrança pelo Stripe;</li>
        <li><strong>Dia 6 em diante:</strong> Se o pagamento não for regularizado, o acesso à plataforma será suspenso. Os dados são preservados;</li>
        <li><strong>Após a regularização:</strong> O acesso é restaurado automaticamente em até 24 horas após a confirmação do pagamento;</li>
        <li><strong>90 dias após a suspensão sem regularização:</strong> Os dados poderão ser anonimizados ou excluídos definitivamente, sem possibilidade de recuperação.</li>
      </ul>
      <div className="highlight-box">
        <strong>⚠️ Atenção:</strong> Mantenha seus dados de pagamento sempre atualizados para
        evitar interrupções no acesso. Você pode atualizar o cartão a qualquer momento em
        Configurações → Assinatura → Método de Pagamento.
      </div>
      <h3>5.5 Como Cancelar sua Assinatura</h3>
      <p>
        Você pode cancelar sua assinatura a qualquer momento, sem burocracia e sem necessidade de
        justificativa. Para cancelar:
      </p>
      <ul>
        <li>Acesse Configurações → Assinatura → Cancelar Plano; ou</li>
        <li>Entre em contato com o suporte solicitando o cancelamento por escrito.</li>
      </ul>
      <p>
        O cancelamento é efetivo ao <strong>final do período já pago</strong>. Isso significa que,
        se você pagou pelo mês de junho e cancela no dia 15, continuará tendo acesso normalmente
        até o último dia de junho. <strong>Não há cobrança adicional</strong> após o cancelamento
        e não há fidelidade mínima.
      </p>
      <p>
        <strong>Não realizamos reembolso proporcional</strong> por dias não utilizados após o
        cancelamento dentro de um período já pago, salvo nas hipóteses descritas na cláusula 5.6
        abaixo ou por determinação legal.
      </p>
      <h3>5.6 Política de Reembolso</h3>
      <p>
        Entendemos que contratar um serviço online envolve confiança, e queremos que você se sinta
        seguro. Por isso, nossa política de reembolso é a seguinte:
      </p>
      <ul>
        <li>
          <strong>Primeiros 7 dias (garantia de satisfação):</strong> Se você contratou um plano
          pago pela primeira vez e, dentro de 7 (sete) dias corridos a partir da data da
          primeira cobrança, decidir que o ObrasCitY não atende às suas necessidades, solicitaremos
          o reembolso integral do valor pago. Para isso, basta entrar em contato com o suporte
          dentro desse prazo;
        </li>
        <li>
          <strong>Após os 7 dias iniciais:</strong> Não são concedidos reembolsos por períodos já
          pagos e não utilizados, pois os custos de infraestrutura já foram incorridos;
        </li>
        <li>
          <strong>Cobrança indevida:</strong> Se você identificar qualquer cobrança que considere
          indevida (valor incorreto, cobrança após cancelamento confirmado, cobrança duplicada,
          etc.), entre em contato com nosso suporte em até 30 dias da data da cobrança. Cobranças
          indevidas comprovadas são reembolsadas integralmente em até 10 dias úteis;
        </li>
        <li>
          <strong>Planos anuais:</strong> Para cancelamentos de planos anuais após os 7 dias
          iniciais, não há reembolso do valor anual restante, mas o acesso é mantido até o
          vencimento do período anual pago.
        </li>
      </ul>
      <h3>5.7 Alteração de Plano (Upgrade e Downgrade)</h3>
      <p>
        <strong>Upgrade (aumentar o plano):</strong> Você pode fazer upgrade para um plano
        superior a qualquer momento. O novo plano entra em vigor imediatamente após a confirmação
        do pagamento. O valor cobrado será proporcional ao tempo restante do período atual mais
        o valor do novo plano para o próximo período.
      </p>
      <p>
        <strong>Downgrade (reduzir o plano):</strong> Você pode solicitar o downgrade para um
        plano inferior a qualquer momento. O downgrade entrará em vigor no início do próximo ciclo
        de cobrança. Atenção: se sua empresa utilizar funcionalidades ou tiver mais usuários do
        que o plano inferior permite, algumas funcionalidades poderão ser desativadas no momento
        em que o downgrade entrar em vigor. Você será avisado sobre isso antes de confirmar o
        downgrade.
      </p>
      <h3>5.8 Alteração de Preços</h3>
      <p>
        O ObrasCitY pode alterar os preços dos planos. Qualquer aumento de preço será comunicado
        com antecedência mínima de 30 (trinta) dias por e-mail. A alteração só será aplicada à
        sua assinatura a partir do próximo ciclo de cobrança após o aviso. Se não concordar com
        o novo preço, você pode cancelar antes da data de vigência da alteração.
      </p>

      {/* 6 */}
      <h2><span className="num">6</span> O Que Você Pode e Não Pode Fazer na Plataforma</h2>
      <h3>6.1 Finalidade da Plataforma</h3>
      <p>
        O ObrasCitY foi desenvolvido exclusivamente para uso profissional no contexto da gestão
        de obras e projetos de construção civil. Ao contratar o serviço, você se compromete a
        utilizá-lo apenas para as finalidades previstas e compatíveis com essa natureza.
      </p>
      <h3>6.2 Usos Expressamente Permitidos</h3>
      <p>Você pode usar o ObrasCitY para:</p>
      <ul>
        <li>Gerenciar obras, canteiros, projetos de construção, reformas e serviços de engenharia;</li>
        <li>Registrar e acompanhar diários de obra, anotações de vistoria e relatórios de progresso;</li>
        <li>Controlar equipes, definir funções e gerenciar permissões de acesso;</li>
        <li>Criar e acompanhar cronogramas, marcos e prazos de obras;</li>
        <li>Gerenciar materiais, estoque, requisições e pedidos a fornecedores;</li>
        <li>Elaborar e controlar orçamentos, medições e custos de obras;</li>
        <li>Registrar contratos e oportunidades de negócio dentro dos módulos ativos da plataforma;</li>
        <li>Gerar, visualizar e exportar relatórios em diferentes formatos (PDF, Excel, DOCX, etc.);</li>
        <li>Comunicar-se com membros da equipe por meio das integrações disponíveis;</li>
        <li>Armazenar e organizar fotos, plantas, documentos técnicos e outros arquivos relacionados às obras;</li>
        <li>Fazer backup e exportar seus dados a qualquer momento.</li>
      </ul>
      <h3>6.3 Usos Expressamente Proibidos — Leia com Atenção</h3>
      <p>
        As ações abaixo são <strong>terminantemente proibidas</strong> e a sua prática constitui
        violação grave destes Termos, podendo resultar em suspensão imediata da conta,
        responsabilização civil por danos e comunicação às autoridades competentes:
      </p>
      <ul>
        <li>
          <strong>Compartilhamento de credenciais:</strong> Compartilhar seu e-mail e senha com
          terceiros, mesmo que sejam colegas de trabalho. Cada pessoa deve ter seu próprio acesso.
          Se precisar de mais usuários, adicione membros à conta da empresa;
        </li>
        <li>
          <strong>Acesso não autorizado:</strong> Tentar acessar contas, dados ou sistemas de
          outros usuários, empresas ou da própria infraestrutura do ObrasCitY sem autorização
          expressa, incluindo o uso de credenciais obtidas de forma indevida;
        </li>
        <li>
          <strong>Engenharia reversa:</strong> Descompilar, desmontar, fazer engenharia reversa,
          tentar extrair o código-fonte, descobrir algoritmos proprietários ou de qualquer forma
          tentar obter acesso ao funcionamento interno da plataforma;
        </li>
        <li>
          <strong>Automação não autorizada:</strong> Usar bots, scripts automatizados, web
          scrapers, crawlers ou qualquer ferramenta automatizada para acessar, extrair ou interagir
          com a plataforma de forma não prevista nas integrações oficiais da API;
        </li>
        <li>
          <strong>Código malicioso:</strong> Enviar, carregar ou tentar instalar vírus,
          ransomware, spyware, trojans, worms, keyloggers ou qualquer outro código malicioso na
          plataforma ou nos sistemas do ObrasCitY;
        </li>
        <li>
          <strong>Ataques cibernéticos:</strong> Realizar ou tentar realizar ataques de negação
          de serviço (DDoS), ataques de força bruta a senhas, injeção de SQL, cross-site scripting
          (XSS), falsificação de requisições (CSRF) ou qualquer outra forma de ataque cibernético;
        </li>
        <li>
          <strong>Uso para fins ilegais:</strong> Utilizar a plataforma para qualquer atividade
          proibida pela legislação brasileira, incluindo lavagem de dinheiro, sonegação fiscal,
          fraude contratual, falsificação de documentos ou corrupção;
        </li>
        <li>
          <strong>Conteúdo ilegal ou ofensivo:</strong> Inserir, armazenar ou transmitir pela
          plataforma conteúdo que seja ilegal, difamatório, obsceno, pornográfico, discriminatório,
          racista, que incite violência ou ódio, ou que viole direitos de qualquer pessoa;
        </li>
        <li>
          <strong>Violação de propriedade intelectual:</strong> Inserir ou utilizar conteúdo que
          viole direitos autorais, marcas registradas, patentes, segredos comerciais ou qualquer
          outro direito de propriedade intelectual de terceiros;
        </li>
        <li>
          <strong>Dados falsos:</strong> Cadastrar informações falsas sobre empresas, obras ou
          pessoas com o objetivo de obter benefícios indevidos, como múltiplos períodos de trial
          ou acesso a funcionalidades não contratadas;
        </li>
        <li>
          <strong>Revenda não autorizada:</strong> Revender, sublicenciar, alugar, ceder ou de
          qualquer forma transferir o acesso à plataforma para terceiros sem autorização prévia
          e escrita do ObrasCitY;
        </li>
        <li>
          <strong>Contorno de medidas de segurança:</strong> Tentar burlar qualquer medida de
          segurança, sistema de autenticação, controle de acesso, limite de plano ou qualquer
          outra restrição técnica da plataforma;
        </li>
        <li>
          <strong>Sobrecarga intencional:</strong> Realizar ações que sobrecarreguem
          desproporcionalmente a infraestrutura do ObrasCitY, prejudicando outros usuários;
        </li>
        <li>
          <strong>Coleta massiva de dados:</strong> Realizar mineração de dados (data mining),
          coleta em massa de informações ou qualquer forma de extração sistemática de conteúdo
          da plataforma sem autorização.
        </li>
      </ul>
      <div className="highlight-box">
        <strong>⚠️ Consequências da violação:</strong> A prática de qualquer ação proibida acima
        autoriza o ObrasCitY a: (1) suspender ou encerrar imediatamente a conta sem aviso prévio
        e sem reembolso; (2) preservar logs e evidências para fins legais; (3) notificar as
        autoridades competentes; (4) ingressar com as medidas judiciais cabíveis para reparação
        de danos, incluindo ação de indenização.
      </div>

      {/* 7 */}
      <h2><span className="num">7</span> Seus Dados e Conteúdo na Plataforma</h2>
      <h3>7.1 Seus Dados São Seus — Propriedade do Conteúdo</h3>
      <p>
        Deixamos isso bem claro: <strong>tudo o que você inserir na plataforma continua sendo
        seu</strong>. O ObrasCitY não reivindica propriedade sobre nenhum dos dados, documentos,
        fotos, relatórios ou informações que você inserir. Você é o proprietário integral do seu
        conteúdo.
      </p>
      <p>
        O que concedemos ao ObrasCitY é apenas uma <strong>licença de uso técnica e operacional</strong>
        — ou seja, a autorização necessária para que nossos sistemas possam armazenar, processar,
        exibir e fazer backup dos seus dados, com o único objetivo de fornecer o serviço a você.
        Essa licença é: não-exclusiva (você pode usar seus dados em outros lugares também),
        gratuita (não pagamos nem cobramos por ela), mundial (necessária porque os servidores podem
        estar em diferentes países) e temporária (encerra quando você exclui a conta).
      </p>
      <h3>7.2 O ObrasCitY Não Usa Seus Dados para Fins Comerciais</h3>
      <p>
        Nós <strong>não utilizamos</strong> o conteúdo dos seus projetos, obras, clientes,
        documentos ou qualquer dado operacional para: (i) vender a terceiros; (ii) criar produtos
        concorrentes; (iii) treinamento de sistemas de inteligência artificial identificáveis com
        seus dados; (iv) publicidade direcionada baseada em seu conteúdo.
      </p>
      <p>
        Podemos utilizar dados agregados e completamente anonimizados (sem qualquer possibilidade
        de identificação de empresas, projetos ou pessoas) para análises estatísticas internas que
        nos ajudem a melhorar a plataforma, como por exemplo: "usuários que utilizam o módulo X
        tendem a usar também o módulo Y".
      </p>
      <h3>7.3 Responsabilidade pelo Conteúdo Inserido</h3>
      <p>
        Você é o <strong>único e exclusivo responsável</strong> por todo o conteúdo que inserir,
        carregar ou compartilhar na plataforma. O ObrasCitY não monitora, revisa, edita ou aprova
        o conteúdo dos usuários antes da publicação. Isso inclui:
      </p>
      <ul>
        <li>Fotos e imagens enviadas;</li>
        <li>Documentos, plantas e laudos técnicos;</li>
        <li>Dados de funcionários, clientes e fornecedores;</li>
        <li>Anotações, comentários e registros de diário;</li>
        <li>Qualquer arquivo carregado na plataforma.</li>
      </ul>
      <p>
        Ao inserir conteúdo, você declara e garante que: (i) tem o direito de usar e compartilhar
        esse conteúdo; (ii) o conteúdo não viola direitos de terceiros; (iii) o conteúdo não é
        ilegal; (iv) você assume total responsabilidade por eventuais reclamações ou ações legais
        de terceiros relacionadas ao conteúdo inserido.
      </p>
      <h3>7.4 Dados Pessoais de Terceiros que Você Insere</h3>
      <p>
        Ao inserir dados pessoais de outras pessoas na plataforma — como nome, CPF, telefone,
        endereço e dados profissionais de funcionários, clientes, fornecedores ou subempreiteiros —
        você se torna o <strong>controlador</strong> desses dados nos termos da LGPD, e o
        ObrasCitY atua como operador.
      </p>
      <p>
        Nessa condição, você declara e garante que:
      </p>
      <ul>
        <li>Possui base legal adequada para tratar esses dados (ex.: contrato de trabalho, contrato de prestação de serviço, consentimento, obrigação legal, etc.);</li>
        <li>Informou os titulares dos dados sobre o tratamento, conforme exigido pela LGPD;</li>
        <li>Os dados foram coletados de forma lícita e transparente;</li>
        <li>Você responderá diretamente perante os titulares e as autoridades por qualquer violação relacionada a esses dados.</li>
      </ul>
      <h3>7.5 Conteúdo Ilegal ou Violador — Remoção</h3>
      <p>
        Embora não monitoremos o conteúdo dos usuários de forma proativa, o ObrasCitY se reserva
        o direito de remover, sem aviso prévio, qualquer conteúdo que: (i) seja claramente ilegal;
        (ii) viole direitos de terceiros; (iii) coloque em risco a segurança de outros usuários;
        (iv) seja denunciado por outros usuários e confirmado como violador. Nos casos mais graves,
        a conta poderá ser suspensa imediatamente.
      </p>

      {/* 8 */}
      <h2><span className="num">8</span> Propriedade Intelectual do ObrasCitY</h2>
      <p>
        Toda a tecnologia, design e identidade do ObrasCitY são resultado de muito trabalho e
        investimento. Por isso, é importante que você entenda o que pode e o que não pode fazer
        com relação à propriedade intelectual da plataforma.
      </p>
      <p>
        São de propriedade exclusiva do ObrasCitY ou de seus licenciadores, e estão protegidos pelas
        leis brasileiras e internacionais de propriedade intelectual:
      </p>
      <ul>
        <li>A marca "ObrasCitY", o logo, o logotipo e toda a identidade visual da plataforma;</li>
        <li>O design, a interface, o layout e a experiência do usuário (UX) da plataforma;</li>
        <li>Todo o código-fonte, algoritmos, banco de dados, arquitetura e tecnologia por trás da plataforma;</li>
        <li>Os modelos de relatórios, dashboards e templates disponibilizados pela plataforma;</li>
        <li>A documentação técnica, guias de uso, materiais de treinamento e qualquer conteúdo produzido pelo ObrasCitY;</li>
        <li>As integrações e APIs desenvolvidas pelo ObrasCitY.</li>
      </ul>
      <p>
        Ao utilizar a plataforma, você <strong>não adquire</strong> nenhum direito de propriedade
        sobre qualquer elemento listado acima. O uso da plataforma é concedido a você apenas como
        uma licença de uso pessoal, não exclusiva, intransferível e revogável, para os fins
        previstos nestes Termos.
      </p>
      <p>
        É expressamente proibido, sem autorização prévia e escrita do ObrasCitY: (i) reproduzir
        ou copiar a interface, design ou qualquer elemento visual da plataforma; (ii) criar
        produtos ou serviços derivados ou concorrentes baseados na tecnologia do ObrasCitY; (iii)
        usar a marca ObrasCitY de qualquer forma que possa causar confusão ou associação indevida;
        (iv) remover ou alterar avisos de copyright ou propriedade intelectual.
      </p>

      {/* 9 */}
      <h2><span className="num">9</span> Disponibilidade, Manutenções e Atualizações do Sistema</h2>
      <h3>9.1 Nosso Compromisso com a Disponibilidade</h3>
      <p>
        O ObrasCitY se compromete a envidar seus melhores esforços técnicos e operacionais para
        manter a plataforma disponível e funcionando da melhor forma possível, 24 horas por dia,
        7 dias por semana, 365 dias por ano. Trabalhamos com infraestrutura redundante e
        monitoramento contínuo exatamente para isso.
      </p>
      <p>
        Contudo, sendo um serviço baseado em tecnologia e dependente de infraestrutura de terceiros
        (provedores de nuvem, redes de internet, serviços de DNS, CDN, etc.),{" "}
        <strong>não garantimos disponibilidade ininterrupta de 100%</strong>. Situações fora do
        nosso controle podem causar instabilidades ou indisponibilidades.
      </p>
      <h3>9.2 Causas de Indisponibilidade</h3>
      <p>O ObrasCitY não se responsabiliza por interrupções causadas por:</p>
      <ul>
        <li>Manutenções programadas previamente comunicadas;</li>
        <li>Falhas nos serviços de infraestrutura de terceiros (AWS, Vercel, Cloudflare, etc.);</li>
        <li>Eventos de força maior: tempestades, terremotos, inundações, guerras, epidemias, etc.;</li>
        <li>Ataques cibernéticos externos (DDoS, ransomware, etc.) que, apesar das medidas de proteção, superem nossas defesas;</li>
        <li>Falhas de conectividade de internet no lado do Usuário;</li>
        <li>Problemas com o dispositivo, navegador ou sistema operacional do Usuário;</li>
        <li>Determinações governamentais ou judiciais que afetem a operação;</li>
        <li>Falhas em serviços de terceiros integrados (Stripe, WhatsApp, etc.).</li>
      </ul>
      <h3>9.3 Manutenções Programadas</h3>
      <p>
        Quando precisarmos realizar manutenções que causem interrupção ou degradação no serviço,
        faremos o possível para: (i) comunicar com antecedência mínima de 24 horas por e-mail e
        aviso dentro da plataforma; (ii) agendar para horários de menor uso (geralmente madrugada);
        (iii) minimizar o tempo de indisponibilidade.
      </p>
      <p>
        Manutenções de emergência (para correção de falhas críticas de segurança ou bugs graves)
        podem ser realizadas sem aviso prévio, dado o caráter urgente.
      </p>
      <h3>9.4 Evolução da Plataforma</h3>
      <p>
        O ObrasCitY está em constante evolução. Isso significa que, ao longo do tempo, poderemos:
      </p>
      <ul>
        <li>Adicionar novas funcionalidades, módulos ou integrações;</li>
        <li>Melhorar funcionalidades existentes com base no feedback dos usuários;</li>
        <li>Modificar a interface para melhorar a experiência de uso;</li>
        <li>Migrar para novas tecnologias mais seguras ou eficientes;</li>
        <li>Encerrar funcionalidades obsoletas ou pouco utilizadas, com aviso prévio adequado.</li>
      </ul>
      <p>
        Mudanças que impliquem redução significativa de funcionalidades contratadas serão
        comunicadas com antecedência mínima de 30 (trinta) dias, dando ao Usuário a opção de
        cancelar sem ônus adicional caso a mudança não lhe seja favorável.
      </p>

      {/* 10 */}
      <h2><span className="num">10</span> Suspensão e Encerramento de Conta</h2>
      <h3>10.1 Suspensão por Iniciativa do ObrasCitY</h3>
      <p>
        O ObrasCitY pode suspender ou encerrar uma conta — temporária ou definitivamente — nos
        seguintes casos, com ou sem aviso prévio dependendo da gravidade:
      </p>
      <ul>
        <li>
          <strong>Com aviso prévio:</strong> inadimplência (após período de carência), downgrade
          que resulte em funcionalidades incompatíveis, solicitação da própria empresa;
        </li>
        <li>
          <strong>Sem aviso prévio (suspensão imediata):</strong> violação grave dos Termos de
          Uso, especialmente das proibições da cláusula 6.3; atividade ilegal ou fraudulenta;
          risco à segurança de outros usuários; ordem judicial ou de autoridade competente; suspeita
          fundada de comprometimento da conta por terceiros mal-intencionados.
        </li>
      </ul>
      <h3>10.2 O Que Acontece com os Dados na Suspensão</h3>
      <p>
        A suspensão de acesso não implica exclusão imediata dos dados. Durante a suspensão:
      </p>
      <ul>
        <li>O acesso à plataforma fica bloqueado, mas os dados são preservados;</li>
        <li>Em caso de suspensão por inadimplência, os dados ficam preservados por 90 dias para eventual reativação;</li>
        <li>Em caso de suspensão por violação grave, os dados podem ser retidos como evidência para fins legais;</li>
        <li>Após 90 dias sem regularização, os dados poderão ser excluídos ou anonimizados definitivamente.</li>
      </ul>
      <h3>10.3 Encerramento Voluntário pelo Usuário</h3>
      <p>
        O Controlador da Conta pode solicitar o encerramento da conta a qualquer momento. Para
        garantir a segurança da operação, o encerramento pode exigir confirmação de identidade.
        Após solicitado o encerramento:
      </p>
      <ul>
        <li>O acesso à plataforma é revogado imediatamente ou ao final do período pago em curso;</li>
        <li>Os dados são mantidos em backup por 90 dias para eventual arrependimento ou recuperação;</li>
        <li>Após 90 dias, todos os dados são excluídos de forma permanente e irreversível;</li>
        <li>Obrigações financeiras pendentes (valores em atraso) continuam exigíveis mesmo após o encerramento;</li>
        <li>Não há reembolso pelo período restante do plano, salvo nas hipóteses da cláusula 5.6.</li>
      </ul>
      <h3>10.4 Exporte seus Dados Antes de Encerrar</h3>
      <p>
        <strong>Recomendamos fortemente</strong> que você exporte todos os seus dados antes de
        solicitar o encerramento da conta. A plataforma oferece ferramentas de exportação
        completa em Configurações → Exportar Dados. Após o prazo de 90 dias, não será possível
        recuperar nenhum dado.
      </p>
      <div className="highlight-box">
        <strong>Atenção:</strong> O encerramento é uma ação permanente. Não é possível recuperar
        uma conta encerrada após o prazo de 90 dias. Certifique-se de ter exportado todos os dados
        necessários antes de confirmar.
      </div>

      {/* 11 */}
      <h2><span className="num">11</span> Limitação de Responsabilidade do ObrasCitY</h2>
      <p>
        O ObrasCitY é uma ferramenta de gestão e organização de informações. Não somos responsáveis
        pela qualidade técnica das obras, pela veracidade dos dados inseridos pelos usuários, pelas
        decisões tomadas com base nas informações da plataforma ou por danos decorrentes de uso
        inadequado.
      </p>
      <p>
        Especificamente, o ObrasCitY <strong>não se responsabiliza</strong> por:
      </p>
      <ul>
        <li>
          <strong>Perda de dados por negligência do Usuário:</strong> Exclusão acidental de dados
          pelo próprio Usuário, perda por falta de exportação antes do encerramento da conta, ou
          perda por uso indevido de credenciais compartilhadas;
        </li>
        <li>
          <strong>Decisões técnicas e profissionais:</strong> A plataforma não substitui a
          responsabilidade técnica de engenheiros, arquitetos, mestres de obras ou qualquer
          profissional habilitado. Laudos, ARTs, RRTs e decisões técnicas são de responsabilidade
          exclusiva dos profissionais competentes;
        </li>
        <li>
          <strong>Erros por dados incorretos:</strong> Relatórios, cálculos ou análises geradas
          pela plataforma com base em dados incorretos ou incompletos inseridos pelo Usuário;
        </li>
        <li>
          <strong>Danos por acesso indevido com credenciais do Usuário:</strong> Danos causados
          por terceiros que obtiveram acesso usando credenciais do Usuário, salvo comprovada falha
          de segurança da própria plataforma;
        </li>
        <li>
          <strong>Lucros cessantes:</strong> Perdas de receita, contratos, clientes ou oportunidades
          de negócio decorrentes de indisponibilidade da plataforma por causas fora de nosso
          controle razoável;
        </li>
        <li>
          <strong>Falhas de serviços de terceiros:</strong> Interrupções no Stripe, WhatsApp, ou
          qualquer outro serviço externo integrado que estejam fora do controle do ObrasCitY;
        </li>
        <li>
          <strong>Danos indiretos e consequenciais:</strong> Quaisquer danos que não sejam
          consequência direta e imediata de uma falha comprovada do ObrasCitY.
        </li>
      </ul>
      <p>
        Em qualquer caso, a responsabilidade total do ObrasCitY perante o Usuário fica limitada
        ao valor efetivamente pago pelo Usuário nos últimos 3 (três) meses de assinatura,
        excetuadas situações em que a lei impeça tal limitação.
      </p>
      <div className="info-box">
        <strong>💡 Lembrete importante sobre o uso profissional:</strong><br />
        O ObrasCitY é uma ferramenta de apoio à gestão — não um substituto para o julgamento
        técnico profissional. Sempre consulte os responsáveis técnicos pela obra (engenheiros,
        arquitetos, etc.) para decisões que envolvam segurança estrutural, segurança dos
        trabalhadores ou compliance legal da construção.
      </div>

      {/* 12 */}
      <h2><span className="num">12</span> Integrações com Serviços Externos</h2>
      <p>
        O ObrasCitY pode oferecer a possibilidade de integrar a plataforma com serviços externos
        de terceiros. No momento, as principais integrações disponíveis ou em desenvolvimento
        incluem serviços de pagamento (Stripe), comunicação (WhatsApp Business), e-mail e
        armazenamento em nuvem.
      </p>
      <p>
        <strong>Ao ativar qualquer integração, você precisa estar ciente de que:</strong>
      </p>
      <ul>
        <li>
          A integração pode envolver o tráfego de dados entre o ObrasCitY e o serviço externo.
          Ao ativar uma integração, você autoriza esse tráfego de dados;
        </li>
        <li>
          Você estará sujeito também aos <strong>Termos de Uso e Política de Privacidade do
          serviço externo</strong>, que são independentes dos termos do ObrasCitY. É sua
          responsabilidade ler e aceitar esses termos;
        </li>
        <li>
          O ObrasCitY não se responsabiliza por falhas, indisponibilidades, mudanças ou
          descontinuidade dos serviços externos;
        </li>
        <li>
          Caso um serviço externo altere sua API de forma incompatível, a integração poderá parar
          de funcionar, e trabalharemos para restaurá-la o mais rápido possível;
        </li>
        <li>
          Cobranças dos serviços externos (quando aplicável) são feitas diretamente pelo próprio
          serviço externo, não pelo ObrasCitY.
        </li>
      </ul>

      {/* 13 */}
      <h2><span className="num">13</span> Confidencialidade Mútua</h2>
      <h3>13.1 Compromisso do ObrasCitY</h3>
      <p>
        O ObrasCitY trata todas as informações dos clientes como estritamente confidenciais. Nossos
        funcionários, prestadores de serviço e parceiros técnicos só têm acesso às informações
        estritamente necessárias para a realização de suas funções, e são contratualmente obrigados
        a manter sigilo.
      </p>
      <p>
        Não divulgaremos suas informações a terceiros, exceto nas seguintes situações absolutamente
        necessárias: (i) com sua autorização expressa; (ii) quando exigido por lei, decisão
        judicial ou determinação de autoridade competente legítima; (iii) para prestadores de
        serviço técnico que atuam como suboperadores, sujeitos a acordos de confidencialidade.
      </p>
      <h3>13.2 Compromisso do Usuário</h3>
      <p>
        Ao utilizar o ObrasCitY, você poderá ter acesso a informações técnicas, comerciais ou
        operacionais do ObrasCitY que não são de domínio público — como características do sistema,
        roadmap de funcionalidades, estrutura de preços, vulnerabilidades corrigidas, etc. Você se
        compromete a manter essas informações em sigilo e a não divulgá-las sem autorização.
      </p>

      {/* 14 */}
      <h2><span className="num">14</span> Segurança da Plataforma — O Que Fazemos para Protegê-lo</h2>
      <p>
        A segurança dos seus dados é uma prioridade absoluta no ObrasCitY. Implementamos múltiplas
        camadas de proteção:
      </p>
      <h3>14.1 Segurança Técnica</h3>
      <ul>
        <li><strong>Criptografia em trânsito:</strong> Toda comunicação entre seu navegador e nossos servidores é criptografada com TLS 1.2 ou superior (HTTPS). Nenhum dado trafega em texto claro;</li>
        <li><strong>Criptografia em repouso:</strong> Dados sensíveis são armazenados com criptografia AES-256, um dos padrões mais seguros disponíveis atualmente;</li>
        <li><strong>Senhas com hash:</strong> Senhas são armazenadas exclusivamente em formato hash irreversível com bcrypt (fator de custo mínimo 12). Nenhum funcionário do ObrasCitY tem acesso à sua senha real — nem nós mesmos conseguimos recuperá-la, apenas redefini-la;</li>
        <li><strong>Isolamento por tenant:</strong> Dados de cada empresa são isolados em nível de banco de dados, impedindo qualquer cruzamento de dados entre empresas diferentes;</li>
        <li><strong>Tokens seguros:</strong> Autenticação baseada em JWT com expiração controlada e rotação de tokens;</li>
        <li><strong>Proteções contra ataques comuns:</strong> Implementamos proteções contra SQL injection, XSS, CSRF, clickjacking e outros vetores de ataque comuns;</li>
        <li><strong>Rate limiting:</strong> Limitação de tentativas de login para prevenir ataques de força bruta.</li>
      </ul>
      <h3>14.2 Segurança Operacional</h3>
      <ul>
        <li>Backups automáticos diários, armazenados em local separado da infraestrutura principal;</li>
        <li>Monitoramento contínuo de logs de acesso e atividades suspeitas;</li>
        <li>Alertas automáticos para comportamentos anômalos;</li>
        <li>Auditorias periódicas de segurança;</li>
        <li>Plano de resposta a incidentes documentado e testado;</li>
        <li>Acesso à infraestrutura restrito a funcionários com necessidade operacional.</li>
      </ul>
      <h3>14.3 Responsabilidade Compartilhada</h3>
      <p>
        A segurança é um esforço conjunto. Fazemos nossa parte na infraestrutura e no código, mas
        você também precisa fazer a sua parte: usar senhas fortes, não compartilhar credenciais,
        manter o dispositivo com antivírus atualizado e estar atento a tentativas de phishing.
        Vulnerabilidades identificadas devem ser reportadas imediatamente ao suporte.
      </p>

      {/* 15 */}
      <h2><span className="num">15</span> Comunicações e Notificações</h2>
      <p>
        Ao criar uma conta, você concorda em receber comunicações do ObrasCitY por e-mail e por
        notificações dentro da plataforma. As comunicações são divididas em dois tipos:
      </p>
      <ul>
        <li>
          <strong>Comunicações essenciais (obrigatórias):</strong> Notificações sobre sua conta,
          alertas de segurança, confirmações de pagamento, avisos de inadimplência, alterações nos
          Termos de Uso ou na Política de Privacidade, comunicados sobre manutenções e atualizações
          importantes. Essas comunicações não podem ser desativadas porque são necessárias para a
          prestação do serviço e para o cumprimento de obrigações legais;
        </li>
        <li>
          <strong>Comunicações de marketing (opcionais):</strong> Newsletters, novidades sobre
          novas funcionalidades, promoções e conteúdo educacional sobre gestão de obras. Essas
          comunicações só são enviadas se você tiver optado por recebê-las (opt-in), e podem ser
          canceladas a qualquer momento pelo link "cancelar inscrição" no rodapé de cada e-mail
          ou pelas Configurações da conta.
        </li>
      </ul>

      {/* 16 */}
      <h2><span className="num">16</span> Alterações nestes Termos de Uso</h2>
      <p>
        O mundo muda, a tecnologia evolui e as leis se atualizam. Por isso, pode ser necessário
        atualizar estes Termos de tempos em tempos. Comprometemo-nos a fazer isso de forma
        transparente:
      </p>
      <ul>
        <li>
          <strong>Alterações materiais</strong> (que afetam seus direitos, obrigações ou o serviço
          prestado): serão comunicadas com antecedência mínima de <strong>30 dias</strong> por
          e-mail e por aviso destacado dentro da plataforma, antes de entrarem em vigor;
        </li>
        <li>
          <strong>Alterações não materiais</strong> (correções gramaticais, esclarecimentos de
          redação sem impacto real, atualização de links): podem ser realizadas sem aviso prévio;
        </li>
        <li>
          A versão atualizada sempre ficará disponível em /termos, com a data de "Última
          atualização" e o número de versão no topo do documento;
        </li>
        <li>
          Se você continuar usando a plataforma após a data de vigência das alterações, isso será
          interpretado como aceite dos novos Termos;
        </li>
        <li>
          Se você não concordar com as alterações, poderá cancelar sua conta antes da data de
          vigência, sem ônus adicional.
        </li>
      </ul>

      {/* 17 */}
      <h2><span className="num">17</span> Disposições Gerais</h2>
      <h3>17.1 Integralidade do Acordo</h3>
      <p>
        Estes Termos de Uso, juntamente com a Política de Privacidade e quaisquer outros documentos
        expressamente incorporados por referência (como termos específicos de planos Enterprise),
        constituem o <strong>acordo completo e integral</strong> entre você e o ObrasCitY sobre
        o uso da plataforma, substituindo quaisquer negociações, propostas, comunicações ou
        entendimentos anteriores sobre o mesmo objeto, sejam verbais ou escritos.
      </p>
      <h3>17.2 Independência das Cláusulas</h3>
      <p>
        Se qualquer cláusula destes Termos for considerada inválida, nula ou inexequível por
        decisão judicial ou arbitral, essa invalidade se limita à cláusula específica, sem afetar
        as demais. O restante do documento permanece válido e em pleno vigor.
      </p>
      <h3>17.3 Não Renúncia de Direitos</h3>
      <p>
        Se o ObrasCitY deixar de exercer algum direito previsto nestes Termos em uma situação
        específica, isso não significa que estamos abrindo mão desse direito para situações
        futuras. Qualquer renúncia formal de direitos deve ser feita por escrito e assinada por
        representante autorizado do ObrasCitY.
      </p>
      <h3>17.4 Cessão</h3>
      <p>
        O Usuário não pode ceder, transferir ou delegar seus direitos ou obrigações decorrentes
        destes Termos a terceiros sem prévia autorização escrita do ObrasCitY. O ObrasCitY pode
        ceder estes Termos em caso de fusão, aquisição, venda de ativos ou reorganização societária,
        mediante notificação ao Usuário com antecedência razoável e garantindo que o novo
        controlador mantenha proteções equivalentes.
      </p>
      <h3>17.5 Força Maior e Caso Fortuito</h3>
      <p>
        O ObrasCitY não será responsabilizado por atrasos, falhas ou descumprimento de obrigações
        causados por eventos imprevisíveis e fora do controle razoável das partes, incluindo:
        desastres naturais, guerras, terrorismo, pandemias, greves gerais, falhas massivas de
        energia, falhas de infraestrutura de internet em escala nacional ou global, e ações
        governamentais que impeçam a operação normal. Nesses casos, o ObrasCitY notificará os
        Usuários o mais brevemente possível sobre a situação e os prazos para normalização.
      </p>
      <h3>17.6 Idioma</h3>
      <p>
        Estes Termos são redigidos em Português do Brasil e esse é o idioma que prevalece em
        qualquer disputa de interpretação. Versões em outros idiomas, se disponíveis, são
        meramente informativas.
      </p>

      {/* 18 */}
      <h2><span className="num">18</span> Lei Aplicável e Resolução de Conflitos</h2>
      <h3>18.1 Lei Aplicável</h3>
      <p>
        Estes Termos de Uso são regidos exclusivamente pelas <strong>leis da República
        Federativa do Brasil</strong>, em especial:
      </p>
      <ul>
        <li><strong>Lei nº 10.406/2002</strong> — Código Civil Brasileiro (contratos, responsabilidade civil);</li>
        <li><strong>Lei nº 12.965/2014</strong> — Marco Civil da Internet (direitos e deveres no uso da internet);</li>
        <li><strong>Lei nº 13.709/2018</strong> — LGPD (tratamento de dados pessoais);</li>
        <li><strong>Lei nº 8.078/1990</strong> — Código de Defesa do Consumidor, quando aplicável às relações de consumo;</li>
        <li>Demais leis e regulamentos federais brasileiros aplicáveis à atividade.</li>
      </ul>
      <h3>18.2 Resolução Amigável</h3>
      <p>
        Antes de qualquer medida judicial, as partes comprometem-se a buscar, de boa-fé e por
        prazo mínimo de 30 dias, uma solução amigável para eventuais conflitos, por meio do canal
        de suporte oficial do ObrasCitY. Acreditamos que a maioria dos problemas pode ser
        resolvida com diálogo.
      </p>
      <h3>18.3 Foro de Eleição</h3>
      <p>
        Não sendo possível a solução amigável, fica eleito o foro da comarca do domicílio do
        Usuário para a resolução de disputas decorrentes destes Termos, conforme estabelecido
        no art. 22, §2º, da Lei nº 12.965/2014 (Marco Civil da Internet), com renúncia expressa
        a qualquer outro foro, por mais privilegiado que seja, salvo nas hipóteses em que a lei
        determine foro diverso.
      </p>

      <div className="info-box" style={{ marginTop: 32 }}>
        <strong>📋 Histórico de versões:</strong><br />
        • Versão 1.0 — Primeira versão (resumida)<br />
        • Versão 2.0 — Reescrita completa (26/05/2026)<br />
        • Versão 3.0 — Versão atual, expandida e detalhada (26/05/2026)<br /><br />
        Para solicitar versões anteriores ou esclarecer dúvidas sobre este documento, entre em
        contato com nossa equipe pelo canal de suporte.
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
