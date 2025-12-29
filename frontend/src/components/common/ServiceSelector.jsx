import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Droplets, 
  Fuel, 
  Zap, 
  Disc, 
  Wind, 
  Circle, 
  Battery, 
  Settings, 
  Thermometer, 
  Plug, 
  Move 
} from 'lucide-react';
import { serviceService } from '../../services/api';
import { toast } from 'react-hot-toast';

const iconMap = {
  'clipboard-check': ClipboardCheck,
  'droplets': Droplets,
  'fuel': Fuel,
  'zap': Zap,
  'disc': Disc,
  'wind': Wind,
  'circle': Circle,
  'battery': Battery,
  'settings': Settings,
  'thermometer': Thermometer,
  'plug': Plug,
  'move': Move,
};

const ServiceSelector = ({ 
  selectedServices = [], 
  onServiceChange, 
  showCategories = true,
  maxSelections = null,
  required = false,
  className = ""
}) => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadServices();
    if (showCategories) {
      loadCategories();
    }
  }, []);

  const loadServices = async () => {
    try {
      const response = await serviceService.getAllServices({ isActive: true });
      const services = response?.data?.data || [];
      setServices(services);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await serviceService.getCategories();
      const categoriesData = response?.data?.data || [];
      setCategories([
        { value: 'all', label: 'Todos los servicios' },
        ...categoriesData.map((c) => ({ value: c, label: c }))
      ]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleServiceToggle = (service) => {
    const isSelected = selectedServices.some(s => s._id === service._id);
    
    if (isSelected) {
      // Remove service
      const newServices = selectedServices.filter(s => s._id !== service._id);
      onServiceChange(newServices);
    } else {
      // Add service
      if (maxSelections && selectedServices.length >= maxSelections) {
        toast.error(`Máximo ${maxSelections} servicios permitidos`);
        return;
      }
      
      const newServices = [...selectedServices, service];
      onServiceChange(newServices);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getTotalPrice = () => {
    return selectedServices.reduce((total, service) => total + service.basePrice, 0);
  };

  const getTotalDuration = () => {
    return selectedServices.reduce((total, service) => total + service.estimatedDuration, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Buscar servicios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {showCategories && categories.length > 0 && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(service => {
          const isSelected = selectedServices.some(s => s._id === service._id);
          const IconComponent = iconMap[service.icon] || Settings;
          
          return (
            <div
              key={service._id}
              onClick={() => handleServiceToggle(service)}
              className={`
                relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Service icon */}
              <div className="flex items-center mb-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                  style={{ backgroundColor: `${service.color}20`, color: service.color }}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-500">{service.estimatedDuration} min</p>
                </div>
              </div>

              {/* Service description */}
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {service.description}
              </p>

              {/* Price and tags */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">
                    ${service.basePrice}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {service.category}
                  </span>
                </div>
                
                {service.tags && service.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {service.tags.slice(0, 3).map(tag => (
                      <span 
                        key={tag}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No se encontraron servicios
        </div>
      )}

      {/* Summary */}
      {selectedServices.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">
            Resumen de servicios seleccionados ({selectedServices.length})
          </h4>
          <div className="space-y-2">
            {selectedServices.map(service => (
              <div key={service._id} className="flex justify-between text-sm">
                <span>{service.name}</span>
                <span>${service.basePrice}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total: {getTotalDuration()} min</span>
              <span>${getTotalPrice()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Required validation message */}
      {required && selectedServices.length === 0 && (
        <p className="text-sm text-red-600">
          Debes seleccionar al menos un servicio
        </p>
      )}
    </div>
  );
};

export default ServiceSelector;