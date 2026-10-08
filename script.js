import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

export default function App() {
  const [pokemons, setPokemons] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [selecionado, setSelecionado] = useState(null);
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [ordem, setOrdem] = useState('az');

  // Busca a lista e depois os detalhes de cada pokémon
  async function buscarPokemons() {
    try {
      setCarregando(true);
      setErro(null);
      const resposta = await fetch(
        'https://pokeapi.co/api/v2/pokemon?limit=30'
      );
      if (!resposta.ok) throw new Error('Falha na API');
      const dados = await resposta.json();

      // Cada item da lista só tem name e url; buscamos os detalhes de todos
      const detalhes = await Promise.all(
        dados.results.map(async (p) => {
          const r = await fetch(p.url);
          if (!r.ok) throw new Error('Falha ao buscar detalhes');
          return r.json();
        })
      );
      setPokemons(detalhes);
    } catch (error) {
      setErro(
        'Ops! Não foi possível carregar os pokémons. Verifique sua conexão.'
      );
      console.log('Erro ao buscar pokémons:', error);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscarPokemons();
  }, []);

  // Lista de tipos existentes nos dados (para o segundo filtro)
  const tipos = [
    'todos',
    ...new Set(pokemons.map((p) => p.types[0].type.name)),
  ];

  // Pesquisa (filter + includes) + filtro por tipo + ordenação (cópia com [...])
  const listaFinal = [
    ...pokemons
      .filter((p) => p.name.toLowerCase().includes(busca.toLowerCase()))
      .filter(
        (p) =>
          tipoFiltro === 'todos' ||
          p.types.some((t) => t.type.name === tipoFiltro)
      ),
  ].sort((a, b) =>
    ordem === 'az' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
  );

  function renderizarItem({ item }) {
    const ativo = selecionado && selecionado.id === item.id;
    return (
      <TouchableOpacity
        style={[estilos.card, ativo && estilos.cardAtivo]}
        onPress={() => setSelecionado(item)}
        activeOpacity={0.7}>
        <Image
          source={{ uri: item.sprites.front_default }}
          style={estilos.imagem}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }}>
          <Text style={estilos.numero}>#{item.id}</Text>
          <Text style={estilos.nome}>{item.name}</Text>
          <Text style={estilos.sec}>
            Tipo: {item.types.map((t) => t.type.name).join(', ')}
          </Text>
          <Text style={estilos.sec}>Peso: {item.weight / 10} kg</Text>
        </View>
        <View style={estilos.selo}>
          <Text style={estilos.seloTexto}>{item.base_experience} XP</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={estilos.container}>
      <Text style={estilos.titulo}>Pokédex SENAI</Text>

      {carregando && (
        <View style={estilos.centro}>
          <ActivityIndicator size="large" color="#CC0000" />
          <Text style={estilos.sec}>Carregando pokémons...</Text>
        </View>
      )}

      {!carregando && erro && (
        <View style={estilos.centro}>
          <Text style={estilos.erro}>{erro}</Text>
          <TouchableOpacity style={estilos.botao} onPress={buscarPokemons}>
            <Text style={estilos.botaoTexto}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {!carregando && !erro && (
        <>
          <TextInput
            style={estilos.input}
            placeholder="Pesquisar pokémon..."
            value={busca}
            onChangeText={setBusca}
          />

          {/* Segundo filtro: tipo */}
          <FlatList
            horizontal
            data={tipos}
            keyExtractor={(t) => t}
            style={{ flexGrow: 0, marginBottom: 8 }}
            contentContainerStyle={{ paddingHorizontal: 15 }}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item: t }) => (
              <TouchableOpacity
                style={[estilos.chip, tipoFiltro === t && estilos.chipAtivo]}
                onPress={() => setTipoFiltro(t)}>
                <Text
                  style={[
                    estilos.chipTexto,
                    tipoFiltro === t && { color: '#FFF' },
                  ]}>
                  {t}
                </Text>
              </TouchableOpacity>
            )}
          />

          <View style={estilos.linha}>
            <Text style={estilos.sec}>
              Resultados encontrados: {listaFinal.length}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={[estilos.chip, ordem === 'az' && estilos.chipAtivo]}
                onPress={() => setOrdem('az')}>
                <Text
                  style={[
                    estilos.chipTexto,
                    ordem === 'az' && { color: '#FFF' },
                  ]}>
                  A → Z
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.chip, ordem === 'za' && estilos.chipAtivo]}
                onPress={() => setOrdem('za')}>
                <Text
                  style={[
                    estilos.chipTexto,
                    ordem === 'za' && { color: '#FFF' },
                  ]}>
                  Z → A
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Renderização condicional: painel só aparece com item selecionado */}
          {selecionado && (
            <View style={estilos.painel}>
              <Text style={estilos.painelTitulo}>{selecionado.name}</Text>
              <Text>ID: {selecionado.id}</Text>
              <Text>
                Tipos: {selecionado.types.map((t) => t.type.name).join(', ')}
              </Text>
              <Text>Altura: {selecionado.height / 10} m</Text>
              <Text>Peso: {selecionado.weight / 10} kg</Text>
              <Text>Experiência base: {selecionado.base_experience}</Text>
              <Text>
                Habilidades:{' '}
                {selecionado.abilities.map((a) => a.ability.name).join(', ')}
              </Text>
              <TouchableOpacity onPress={() => setSelecionado(null)}>
                <Text style={estilos.fechar}>Fechar</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={listaFinal}
            renderItem={renderizarItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={estilos.lista}
            ListEmptyComponent={
              <Text style={estilos.erro}>Nenhum pokémon encontrado.</Text>
            }
            // Funcionalidade pesquisada: puxar para atualizar (RefreshControl)
            refreshControl={
              <RefreshControl
                refreshing={carregando}
                onRefresh={buscarPokemons}
              />
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', paddingTop: 20 },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  erro: { fontSize: 16, color: '#CC0000', textAlign: 'center', padding: 20 },
  input: {
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    marginRight: 6,
  },
  chipAtivo: { backgroundColor: '#CC0000' },
  chipTexto: { color: '#333', textTransform: 'capitalize' },
  botao: {
    backgroundColor: '#CC0000',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  botaoTexto: { color: '#FFF', fontWeight: 'bold' },
  lista: { paddingHorizontal: 15, paddingBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
  },
  cardAtivo: { borderWidth: 2, borderColor: '#CC0000' },
  imagem: { width: 60, height: 60, marginRight: 15 },
  numero: { fontSize: 14, color: '#999' },
  nome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
  },
  sec: { fontSize: 14, color: '#666' },
  selo: {
    backgroundColor: '#FFCB05',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seloTexto: { fontWeight: 'bold', fontSize: 12, color: '#333' },
  painel: {
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#CC0000',
  },
  painelTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  fechar: { color: '#CC0000', marginTop: 6, fontWeight: 'bold' },
});
