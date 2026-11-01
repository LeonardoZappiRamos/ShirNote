# PRD — Visualizador Web de Partituras Encore (.enc)

Nov 1, 2026 · @Zappi

## 1. Visão geral e problema

O produto é um visualizador web que abre arquivos `.enc` do Encore e mostra a partitura no navegador, sem instalar o programa original.

**Problema.** O Encore é um software de notação musical antigo, e seus arquivos `.enc` só abrem nele. Quem guarda partituras nesse formato depende de um programa descontinuado, de um sistema operacional compatível e, muitas vezes, de uma máquina virtual. A extensão `.enc` também é usada por outros formatos, inclusive arquivos criptografados, então identificar o arquivo certo faz parte do problema.

**Solução proposta.** Ler o `.enc` no navegador, interpretar o conteúdo musical essencial, convertê-lo para um modelo interno neutro, gerar MusicXML e renderizá-lo com OpenSheetMusicDisplay (OSMD), que exibe MusicXML via VexFlow.

**Premissa central.** O formato `.enc` não tem especificação pública conhecida por este projeto. A primeira fase é de engenharia reversa a partir de amostras reais, e todo o cronograma depende dela.

## 2. Objetivos, não-objetivos e métricas

O MVP é bem-sucedido se abrir partituras simples do Encore no navegador, com notas, ritmos e armaduras corretos.

**Objetivos**

- Abrir um `.enc` de melodia simples e renderizá-lo corretamente.
- Rejeitar arquivos incompatíveis com mensagem clara, sem travar a interface.
- Documentar o formato `.enc` em `docs/enc-format.md`, para que o conhecimento não dependa de uma pessoa.
- Manter o modelo musical independente do Encore e do MusicXML, para permitir novos formatos de entrada e saída depois.

**Não-objetivos do MVP**

- Reprodução MIDI ou áudio.
- Edição de partitura.
- Exportação para PDF, MIDI ou MusicXML.
- Layout idêntico ao do Encore.
- Conversão em lote.

**Métricas propostas** (metas a confirmar)

| Métrica | Meta proposta |
| --- | --- |
| Amostras `.enc` simples abertas sem erro | 90% do conjunto de teste |
| Fidelidade de compassos, notas, alturas e durações nas amostras suportadas | 100% |
| Arquivos inválidos que travam a interface | 0 |
| Tempo para renderizar uma partitura de até 50 compassos | até 3 s |

## 3. Público-alvo e casos de uso

O público principal é quem tem partituras legadas em `.enc` e quer vê-las sem o Encore.

| Persona | Necessidade | Caso de uso principal |
| --- | --- | --- |
| Músico ou professor com acervo antigo | Consultar partituras antigas | Abrir um `.enc` e ler a partitura na tela |
| Arquivista ou biblioteca musical | Preservar e catalogar obras | Verificar o conteúdo de arquivos legados |
| Desenvolvedor ou pesquisador do formato | Entender e documentar o `.enc` | Usar parser e documentação como base |

O MVP atende primeiro a persona de leitura. A de desenvolvedor é atendida pela documentação do formato e pelos testes com amostras.

## 4. Escopo do MVP

O MVP cobre abrir, converter e visualizar partituras simples; tudo que for tocar, editar ou exportar fica para fases seguintes.

| Dentro do MVP | Fora do MVP |
| --- | --- |
| Upload ou seleção de um `.enc` | Reprodução MIDI ou áudio |
| Parser do formato Encore | Edição de partitura |
| Conversão para MusicXML | Exportação para PDF, MIDI ou MusicXML |
| Visualização com zoom e rolagem | Layout idêntico ao Encore |
| Mensagens claras de erro | Tablaturas complexas e percussão avançada |
| Título, autor, compasso, tonalidade, claves, notas, pausas e uma ou mais vozes | Letras, cifras e articulações sofisticadas |
| Modo tolerante: renderiza o que entende e avisa o que ignorou | Conversão em lote |

## 5. Requisitos funcionais

São 12 requisitos; os de prioridade Alta formam o primeiro entregável, uma melodia de uma voz renderizada no OSMD.

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-01 | Aceitar upload de arquivo com extensão `.enc` por seleção ou arrastar e soltar | Alta |
| RF-02 | Ler o arquivo como `ArrayBuffer` no navegador, sem enviá-lo a servidor | Alta |
| RF-03 | Validar cabeçalho e magic bytes e rejeitar arquivos que não sejam Encore | Alta |
| RF-04 | Extrair metadados: título e autor | Média |
| RF-05 | Extrair partes, compassos, fórmula de compasso, tonalidade e claves | Alta |
| RF-06 | Extrair notas e pausas com altura, oitava e duração | Alta |
| RF-07 | Suportar múltiplas partes (por exemplo, piano) e múltiplas vozes | Média |
| RF-08 | Converter o modelo interno em MusicXML `score-partwise` válido | Alta |
| RF-09 | Renderizar o MusicXML no OSMD dentro da página | Alta |
| RF-10 | Oferecer zoom e rolagem horizontal e vertical | Média |
| RF-11 | Exibir mensagens de erro claras e avisos sobre recursos não suportados | Alta |
| RF-12 | Oferecer arquivos de exemplo para demonstração | Baixa |

## 6. Requisitos não funcionais

O processamento acontece inteiro no navegador, o que protege a privacidade dos arquivos e dispensa servidor.

| ID | Categoria | Requisito |
| --- | --- | --- |
| RNF-01 | Privacidade | Nenhum arquivo é enviado a servidor; o parse roda no cliente |
| RNF-02 | Robustez | Arquivo corrompido ou desconhecido nunca trava a interface; erros são capturados e exibidos |
| RNF-03 | Desempenho | Partitura de até 50 compassos renderiza em até 3 s em um notebook comum (meta a validar) |
| RNF-04 | Compatibilidade | Versões atuais de Chrome, Firefox, Edge e Safari |
| RNF-05 | Manutenibilidade | Parser, modelo musical e gerador de MusicXML em módulos separados, sem acoplamento |
| RNF-06 | Testabilidade | Cada recurso suportado tem ao menos um `.enc` de teste versionado |
| RNF-07 | Acessibilidade | Interface navegável por teclado, com contraste adequado nos controles e mensagens de erro |
| RNF-08 | Idioma | Interface em português do Brasil |

## 7. Arquitetura e stack

&#91;embedded content: arquitetura em camadas · 6 módulos\]

O arquivo atravessa seis módulos em sequência, e cada um conhece só o vizinho; trocar o renderizador ou aceitar outro formato de entrada mexe em um módulo. O código fica em `src/enc`, `src/music`, `src/musicxml` e `src/components`, e a documentação em `docs/`.

## 8. Descoberta do formato .enc

O formato é desconhecido, então a fase de descoberta vem antes de qualquer código de produto e termina com `docs/enc-format.md`.

1. **Coletar amostras reais.** Reunir de 10 a 30 arquivos criados no Encore, de complexidade crescente: uma nota, um compasso, uma escala, uma melodia, duas vozes e uma partitura de piano. Registrar versão do Encore, sistema operacional e configurações.
2. **Criar amostras controladas.** Gerar arquivos com mudanças mínimas entre si (uma nota alterada, um compasso a mais, outra tonalidade, outra clave) para isolar como cada elemento é codificado.
3. **Comparar em hexadecimal.** Comparar arquivos quase idênticos para achar magic bytes, cabeçalho, contadores, offsets e campos. Registrar cada achado em tabela: offset, tamanho, tipo, significado provável e evidência.
4. **Analisar o executável apenas se necessário.** Com Ghidra, IDA Free ou Radare2 em uma VM, procurar strings e rotinas de leitura de arquivo. O foco é entender a leitura do formato, não proteção de licença.
5. **Documentar.** Descrever cabeçalho, versão, partes, compassos, notas, durações, claves, armaduras, texto e metadados, com exemplos binários e diagramas.

**Condição de saída:** o parser abre as amostras simples e cada campo documentado tem ao menos uma amostra que o comprova.

## 9. Fluxo de usuário e UX

A interface tem uma única tela: carregar, ver o status e ler a partitura.

1. A pessoa abre a página e vê a área de upload e os arquivos de exemplo.
2. Seleciona ou arrasta um `.enc`.
3. O painel de status mostra a etapa atual: lendo, validando, convertendo, renderizando.
4. A partitura aparece na área de renderização, com zoom e rolagem.
5. Se algo não for suportado, um aviso lista o que foi ignorado, e o restante continua visível.
6. Se o arquivo for inválido, uma mensagem diz o motivo e o que fazer, sem recarregar a página.

**Componentes:** `FileUploader`, `ScoreViewer` e `StatusBar`.

**Estados a desenhar:** vazio, carregando, sucesso, sucesso com avisos e erro.

## 10. Testes e critérios de aceite

Cada recurso suportado precisa de um `.enc` de teste versionado, e a conversão é comparada elemento a elemento.

**Testes automatizados** (Vitest ou Jest, com fixtures em `tests/fixtures/`): para cada amostra, comparar número de compassos, notas, alturas, durações, claves, tonalidades e fórmulas de compasso com o esperado. Validar o MusicXML gerado e abri-lo no OSMD.

**Critérios de aceite do MVP**

- [ ] O usuário envia um `.enc` pelo navegador.
- [ ] O app identifica se o arquivo é compatível.
- [ ] Uma partitura simples é renderizada corretamente.
- [ ] Notas, pausas, compassos, claves, tonalidades e fórmulas de compasso aparecem corretamente.
- [ ] Arquivos inválidos geram mensagem clara, sem travar a interface.
- [ ] Cada recurso suportado tem ao menos um `.enc` de teste.
- [ ] O MusicXML gerado abre no OSMD e, idealmente, em outro visualizador MusicXML.

## 11. Roadmap e marcos

&#91;embedded content: roadmap · 5 fases, 5 portões\]

As fases seguem a ordem de execução do projeto e não estão em escala: as datas dependem do que a descoberta do formato revelar e devem ser definidas ao fim da fase 1.

## 12. Riscos, premissas e questões em aberto

O maior risco é o próprio formato: sem especificação, o prazo depende do que as amostras revelarem.

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Formato varia por versão do Encore, sistema ou opção de salvamento | Parser falha em parte dos arquivos | Coletar amostras de várias versões; validar por magic bytes e versão |
| `.enc` também é usado por outros formatos, inclusive criptografados | Arquivo errado tratado como Encore | Validação de cabeçalho e mensagem específica de incompatibilidade |
| Layout, fontes e paginação do Encore não são reproduzíveis | Aparência diferente da original | Declarar como não-objetivo; priorizar o conteúdo musical |
| Poucas amostras reais disponíveis | Descoberta lenta ou incompleta | Criar amostras controladas no Encore (exige acesso ao programa) |
| Recursos avançados (percussão, tablatura, letras, cifras) | Partituras complexas incompletas | Modo tolerante: renderizar o que for entendido e avisar o resto |

**Premissas**

- Há acesso ao Encore, ou a amostras suficientes, para gerar arquivos de teste.
- O OSMD renderiza de forma adequada o MusicXML gerado.

**Questões em aberto**

- Quais versões do Encore precisam ser suportadas?
- Quem fornecerá as amostras reais e com que direitos de uso?
- A demo será pública ou de uso interno?
- Há restrição legal à análise do executável do Encore na sua jurisdição? Convém confirmar antes de iniciar essa etapa.
