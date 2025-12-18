//= require active_admin/base
//= require activeadmin/quill_editor/quill
//= require activeadmin/quill_editor_input

$(document).ready(function() {
  const stateSelect = $('#company_state');
  const citySelect = $('#company_city');

  if (stateSelect.length && citySelect.length) {
    // Get initial values from data attributes
    const selectedState = stateSelect.data('selected');
    const selectedCity = citySelect.data('selected');

    // Function to load states
    function loadStates() {
      stateSelect.empty().append('<option value="">Carregando...</option>');
      
      fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
        .then(response => response.json())
        .then(states => {
          stateSelect.empty().append('<option value="">Selecione um estado</option>');
          states.forEach(state => {
            const option = new Option(state.nome, state.sigla);
            stateSelect.append(option);
          });

          if (selectedState) {
            stateSelect.val(selectedState);
            loadCities(selectedState, selectedCity);
          }
        })
        .catch(error => {
          console.error('Error loading states:', error);
          stateSelect.empty().append('<option value="">Erro ao carregar estados</option>');
        });
    }

    // Function to load cities
    function loadCities(state, preselectedCity = null) {
      citySelect.prop('disabled', true).empty().append('<option value="">Carregando...</option>');
      
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`)
        .then(response => response.json())
        .then(cities => {
          citySelect.empty().append('<option value="">Selecione uma cidade</option>');
          cities.forEach(city => {
            const option = new Option(city.nome, city.nome);
            citySelect.append(option);
          });
          
          citySelect.prop('disabled', false);

          if (preselectedCity) {
            citySelect.val(preselectedCity);
          }
        })
        .catch(error => {
          console.error('Error loading cities:', error);
          citySelect.empty().append('<option value="">Erro ao carregar cidades</option>');
        });
    }

    // Initialize
    loadStates();

    // Event listener for state change
    stateSelect.on('change', function() {
      const state = $(this).val();
      if (state) {
        loadCities(state);
      } else {
        citySelect.empty().append('<option value="">Selecione um estado primeiro</option>');
        citySelect.prop('disabled', true);
      }
    });
  }
});
