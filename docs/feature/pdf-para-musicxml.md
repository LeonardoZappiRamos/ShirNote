# PDF para MusicXML (estudo)

- Versão: 0.1 (estudo a fazer; nada decidido)
- Data: 2026-11-08
- Requisitos: RFM-03 (PRD móvel v2.1), questão Q8
- Decisão: depende deste estudo. Se for viável, vira ADR; se não, PDF não vai para o servidor.

Pedido do owner (Q8): estudar se dá para transformar o PDF importado em MusicXML. Se der, o PDF entra
na biblioteca como qualquer partitura (transpõe, sincroniza, aparece na web). Se não der, o PDF fica
só no aparelho e no OneDrive/Google Drive, como hoje no ADR 0010.

---

## 1. O problema

Converter imagem de partitura em notas é **reconhecimento óptico de música** (OMR). Nenhuma
ferramenta acerta 100%: erros comuns são acidentes, ligaduras, quiálteras, texto e partituras
escaneadas tortas ou com baixa resolução. O resultado precisa de conferência humana.

## 2. Candidatas a avaliar

| Ferramenta | Tipo | Licença | Onde rodaria | Observação |
| --- | --- | --- | --- | --- |
| Audiveris | Aplicação Java, linha de comando | AGPL-3.0 | Backend | Exporta MusicXML; AGPL exige cuidado (rodar como processo separado e sem modificar) |
| oemer | Python, rede neural | MIT | Backend | Mais novo; precisa de GPU para ser rápido |
| Serviços comerciais (ex.: PlayScore, ScanScore) | API ou app | Proprietária | Externo | Custo por página; o arquivo sai para terceiro (fere RNFM-02 sem consentimento) |

## 3. Como medir

1. Juntar 10 PDFs reais com direito de uso: 5 exportados do Encore (PDF "limpo", vetor) e 5
   escaneados.
2. Para os 5 do Encore já existe o gabarito: o MusicXML de referência em `tests/fixtures/reference/`.
3. Rodar cada ferramenta e comparar nota a nota com o gabarito (altura, figura, compasso), como o
   `enc-spike --check` faz hoje.
4. Medir: % de notas certas, compassos com erro, tempo por página, custo e licença.

## 4. Critério de decisão (proposta)

| Resultado | Decisão |
| --- | --- |
| ≥ 98% das notas certas no PDF limpo, < 30 s por página, licença compatível | Converter, com aviso "confira a partitura" e opção de manter o PDF original junto |
| Abaixo disso | Não converter. PDF fica só no aparelho e na nuvem pessoal |

## 5. Duplicados

Vale a regra do [ADR 0012](../decisions/0012-exigir-nome-unico-na-biblioteca.md) também para PDF:
nome único e o mesmo conteúdo avisado como duplicado.
