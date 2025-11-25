'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  Search, 
  Star, 
  MapPin, 
  Building2, 
  Filter,
  X,
  Sliders,
  Zap
} from 'lucide-react';

interface SidebarFilterProps {
  filters: {
    state: string;
    city: string;
    rating: number;
    verified: boolean;
  };
  onFilterChange: (filterType: string, value: any) => void;
  locationsData?: Record<string, string[]>;
  categories?: any[];
  categoriesLoading?: boolean;
}

const FilterSection = ({ 
  title, 
  icon, 
  children, 
  isOpen, 
  onToggle, 
  count = 0, 
  className = '' 
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  count?: number;
  className?: string;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }} 
    animate={{ opacity: 1, y: 0 }} 
    transition={{ duration: 0.3 }} 
    className={`border border-gray-200/60 rounded-2xl bg-white/80 backdrop-blur-xl 
               shadow-lg shadow-gray-200/40 hover:shadow-xl hover:shadow-gray-200/60
               hover:border-blue-200/60 transition-all duration-300 ${className}`}
  >
    <button
      className="flex justify-between items-center w-full p-5 text-gray-800 font-semibold text-base 
                hover:bg-blue-50/50 rounded-2xl transition-all duration-300 group"
      onClick={onToggle}
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 
                       group-hover:from-blue-100 group-hover:to-blue-200 group-hover:text-blue-600 
                       transition-all duration-300 shadow-sm">
          {icon}
        </div>
        <span className="font-semibold">{title}</span>
        {count > 0 && (
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs px-2.5 py-1 
                         rounded-full shadow-sm">
            {count}
          </Badge>
        )}
      </div>
      <ChevronDown className={`h-5 w-5 text-gray-400 transition-all duration-300 group-hover:text-blue-600 
                              ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
    </button>
    
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="px-4 pb-4 space-y-1.5 overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

const FilterButton = ({ 
  active, 
  children, 
  onClick, 
  icon 
}: { 
  active: boolean; 
  children: React.ReactNode; 
  onClick: () => void; 
  icon?: React.ReactNode;
}) => (
  <motion.button
    whileHover={{ x: 4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full text-left flex items-center gap-2.5 text-sm py-2.5 px-3 rounded-lg 
              transition-all duration-200 group font-medium ${
      active
        ? 'bg-blue-500 text-white shadow-md'
        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-800'
    }`}
  >
    {icon && (
      <div className={`text-xs transition-all ${
        active ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'
      }`}>
        {icon}
      </div>
    )}
    <span className="flex-1 font-medium text-sm">{children}</span>
    {active && (
      <X className="h-3 w-3" />
    )}
  </motion.button>
);

const RatingButton = ({ 
  rating, 
  active, 
  onClick 
}: { 
  rating: number; 
  active: boolean; 
  onClick: () => void;
}) => (
  <motion.button
    whileHover={{ x: 4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full text-left flex items-center gap-2.5 text-sm py-2.5 px-3 rounded-lg 
              transition-all duration-200 group font-medium ${
      active
        ? 'bg-gradient-to-r from-orange-400 to-yellow-400 text-white shadow-md'
        : 'text-gray-700 hover:bg-yellow-50 hover:text-orange-800'
    }`}
  >
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          className={`h-3.5 w-3.5 transition-all duration-200 ${
            i < rating 
              ? active 
                ? 'text-white fill-white' 
                : 'text-yellow-400 fill-yellow-400 group-hover:text-orange-500 group-hover:fill-orange-500'
              : active
                ? 'text-white/40'
                : 'text-gray-300 group-hover:text-orange-200'
          }`} 
        />
      ))}
    </div>
    <span className="flex-1 font-medium text-sm">
      {rating === 5 ? '5 Estrelas' : `${rating}+ Estrelas`}
    </span>
    {active && (
      <X className="h-3 w-3" />
    )}
  </motion.button>
);

const SidebarFilter = ({ filters, onFilterChange, locationsData = {}, categories, categoriesLoading }: SidebarFilterProps) => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['search']));

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };
  
  const handleFilterClick = (filterType: string, value: any) => {
    if (filters[filterType as keyof typeof filters] === value) {
      onFilterChange(filterType, filterType === 'verified' ? false : null);
    } else {
      onFilterChange(filterType, value);
    }
  };

  const clearAllFilters = () => {
    onFilterChange('clearAll', null);
  };

  const ratings = [
    { value: 5, label: '5 Estrelas' },
    { value: 4, label: '4+ Estrelas' },
    { value: 3, label: '3+ Estrelas' }
  ];

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'verified') return value === true;
    if (key === 'rating') return Number(value) > 0;
    return value && value !== '';
  }).length;

  // Mock data for states and cities - replace with actual API data
  const mockStatesData = {
    'São Paulo': ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto'],
    'Rio de Janeiro': ['Rio de Janeiro', 'Niterói', 'Nova Iguaçu', 'Petrópolis'],
    'Minas Gerais': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora'],
    'Paraná': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa'],
    'Rio Grande do Sul': ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Santa Maria'],
    'Bahia': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari'],
    'Santa Catarina': ['Florianópolis', 'Joinville', 'Blumenau', 'São José'],
    'Goiás': ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde'],
    'Pernambuco': ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru'],
    'Ceará': ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú']
  };

  const availableStates = Object.keys(mockStatesData).sort();
  const availableCities = filters.state ? mockStatesData[filters.state as keyof typeof mockStatesData] || [] : [];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full lg:w-80 bg-white/95 backdrop-blur-md rounded-2xl 
                border border-gray-200/60 shadow-xl shadow-gray-300/20 p-6 space-y-5
                sticky top-8 max-h-[calc(100vh-3rem)] overflow-y-auto"
    >
      {/* Header with clean modern design */}
      <div className="flex justify-between items-start pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">Filtros</h3>
          </div>
        </div>
        
        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearAllFilters} 
            className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg 
                     transition-all duration-200 text-xs px-3 py-1.5 h-auto"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>
      
      {/* State Filter */}
      {availableStates.length > 0 && (
        <FilterSection 
          title="Estados" 
          icon={<MapPin className="h-4 w-4" />}
          isOpen={openSections.has('states')} 
          onToggle={() => toggleSection('states')}
          count={availableStates.length}
        >
          <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
            {availableStates.map((state) => (
              <FilterButton
                key={state}
                active={filters.state === state}
                onClick={() => handleFilterClick('state', state)}
                icon={<MapPin className="h-3 w-3" />}
              >
                {state}
              </FilterButton>
            ))}
          </div>
        </FilterSection>
      )}

      {/* City Filter */}
      {filters.state && availableCities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <FilterSection 
            title={`Cidades - ${filters.state}`}
            icon={<Building2 className="h-4 w-4" />}
            isOpen={openSections.has('cities')} 
            onToggle={() => toggleSection('cities')}
            count={availableCities.length}
          >
            <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
              {Array.from(availableCities).sort().map((city) => (
                <FilterButton
                  key={city}
                  active={filters.city === city}
                  onClick={() => handleFilterClick('city', city)}
                  icon={<Building2 className="h-3 w-3" />}
                >
                  {city}
                </FilterButton>
              ))}
            </div>
          </FilterSection>
        </motion.div>
      )}

      {/* Rating Filter */}
      <FilterSection 
        title="Avaliações" 
        icon={<Star className="h-4 w-4" />}
        isOpen={openSections.has('ratings')} 
        onToggle={() => toggleSection('ratings')}
      >
        <div className="space-y-1">
          {ratings.map((rating) => (
            <RatingButton
              key={rating.value}
              rating={rating.value}
              active={filters.rating === rating.value}
              onClick={() => handleFilterClick('rating', rating.value)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Verified Companies Filter */}
      <FilterSection 
        title="Empresas Verificadas" 
        icon={<Zap className="h-4 w-4" />}
        isOpen={openSections.has('verified')} 
        onToggle={() => toggleSection('verified')}
      >
        <FilterButton
          active={filters.verified}
          onClick={() => handleFilterClick('verified', true)}
          icon={<Zap className="h-3 w-3" />}
        >
          Apenas empresas verificadas
        </FilterButton>
      </FilterSection>

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-50/50 rounded-lg border border-blue-100"
        >
          <h4 className="font-semibold text-sm text-blue-800 mb-2 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros Ativos ({activeFiltersCount})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(filters).map(([key, val]) =>
              (key === 'verified' && Boolean(val)) || (key === 'rating' && Number(val) > 0) || (val && val !== '') ? (
                <Badge
                  key={key}
                  className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer 
                           transition-all duration-200 px-2.5 py-1 text-xs rounded-md"
                  onClick={() => handleFilterClick(key, key === 'verified' ? false : key === 'rating' ? 0 : '')}
                >
                  {key === 'state' ? `Estado: ${val}` : 
                   key === 'city' ? `Cidade: ${val}` : 
                   key === 'rating' ? `${val}+ ⭐` : 
                   key === 'verified' ? 'Verificadas' : val}
                  <X className="ml-1.5 h-3 w-3" />
                </Badge>
              ) : null
            )}
          </div>
        </motion.div>
      )}

      {/* Simple help section */}
      <div className="pt-4 border-t border-gray-100">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            💡 Combine filtros para resultados mais precisos
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default SidebarFilter;
