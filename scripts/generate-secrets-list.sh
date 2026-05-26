#!/bin/bash

# Script para extrair variáveis do .env.local e gerar instruções para adicionar no GitHub

echo "=== Variáveis a adicionar no GitHub Secrets ==="
echo ""
echo "URL: https://github.com/DrakkonxJH/planobras/settings/secrets/actions"
echo ""
echo "Clique em 'New repository secret' para cada linha abaixo:"
echo ""

# Lê o .env.local e exibe cada variável
if [ -f ".env.local" ]; then
    while IFS='=' read -r name value; do
        # Ignora linhas vazias e comentários
        if [[ ! -z "$name" && ! "$name" =~ ^# ]]; then
            echo "Name: $name"
            echo "Secret: $value"
            echo "---"
        fi
    done < .env.local
else
    echo "❌ Arquivo .env.local não encontrado!"
    exit 1
fi

echo ""
echo "✅ Total de variáveis: $(grep -c '^[^#]' .env.local)"
echo ""
echo "Após adicionar todos, o deployment estará 100% funcional!"
