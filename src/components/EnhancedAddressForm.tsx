import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Check, 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Star,
  Clock,
  User,
  Building2,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { Address } from '../types';
import { CSVAddressService } from '../services/csvAddressService';
import { AddressDatabaseService, EnhancedAddress, AddressNote } from '../services/addressDatabase';

interface EnhancedAddressFormProps {
  initialAddress?: Address;
  onAddressSelect: (address: Address) => void;
  onCancel: () => void;
  currentUser?: string;
}

export const EnhancedAddressForm: React.FC<EnhancedAddressFormProps> = ({
  initialAddress,
  onAddressSelect,
  onCancel,
  currentUser = 'Utilisateur'
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<EnhancedAddress | null>(null);
  const [showAddressDetails, setShowAddressDetails] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [manualAddress, setManualAddress] = useState<Partial<Address>>({
    street_number: '',
    street_name: '',
    postal_code: '',
    city: '',
    country: 'France'
  });

  useEffect(() => {
    if (initialAddress) {
      setQuery(CSVAddressService.normalizeFullAddress(initialAddress));
      const enhanced = AddressDatabaseService.findAddress(initialAddress);
      if (enhanced) {
        setSelectedAddress(enhanced);
        setShowAddressDetails(true);
      }
    }
  }, [initialAddress]);

  useEffect(() => {
    if (query.length >= 3 && !manualMode) {
      setIsLoading(true);
      
      // Rechercher d'abord dans la base locale
      const localResults = AddressDatabaseService.searchAddresses(query);
      
      // Puis rechercher en ligne
      CSVAddressService.searchAddressesDebounced(query)
        .then(onlineResults => {
          // Combiner les résultats locaux et en ligne
          const combined = [
            ...localResults.map(addr => ({ ...addr, isLocal: true })),
            ...onlineResults.map(result => ({ ...result, isLocal: false }))
          ];
          
          setSuggestions(combined);
          setShowSuggestions(true);
          setIsLoading(false);
        })
        .catch(() => {
          setSuggestions(localResults.map(addr => ({ ...addr, isLocal: true })));
          setShowSuggestions(true);
          setIsLoading(false);
        });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, manualMode]);

  const handleSuggestionSelect = (suggestion: any) => {
    if (suggestion.isLocal) {
      // Adresse de la base locale
      setSelectedAddress(suggestion);
      setQuery(CSVAddressService.normalizeFullAddress(suggestion));
      setShowAddressDetails(true);
    } else {
      // Adresse en ligne
      const address = CSVAddressService.parseCSVAddress(suggestion);
      const enhanced = AddressDatabaseService.findAddress(address);
      
      if (enhanced) {
        setSelectedAddress(enhanced);
        setShowAddressDetails(true);
      } else {
        // Créer une nouvelle adresse dans la base
        const newEnhanced = AddressDatabaseService.addOrUpdateAddress(address);
        setSelectedAddress(newEnhanced);
        setShowAddressDetails(true);
      }
      
      setQuery(CSVAddressService.normalizeFullAddress(address));
    }
    
    setShowSuggestions(false);
  };

  const handleAddNote = () => {
    if (!selectedAddress || !newNote.trim()) return;

    try {
      AddressDatabaseService.addNoteToAddress(
        selectedAddress.id,
        newNote.trim(),
        currentUser,
        true
      );
      
      // Recharger l'adresse avec les nouvelles notes
      const updated = AddressDatabaseService.findAddress(selectedAddress);
      if (updated) {
        setSelectedAddress(updated);
      }
      
      setNewNote('');
    } catch (error) {
      alert('Erreur lors de l\'ajout de la note');
    }
  };

  const handleEditNote = (noteId: string) => {
    const note = selectedAddress?.notes.find(n => n.id === noteId);
    if (note) {
      setEditingNote(noteId);
      setEditNoteText(note.note);
    }
  };

  const handleSaveEditNote = () => {
    if (!editingNote || !editNoteText.trim()) return;

    try {
      AddressDatabaseService.updateNote(editingNote, editNoteText.trim(), currentUser);
      
      // Recharger l'adresse
      const updated = AddressDatabaseService.findAddress(selectedAddress!);
      if (updated) {
        setSelectedAddress(updated);
      }
      
      setEditingNote(null);
      setEditNoteText('');
    } catch (error) {
      alert('Erreur lors de la modification de la note');
    }
  };

  const handleDeleteNote = (noteId: string) => {
    if (!confirm('Supprimer cette note ?')) return;

    try {
      AddressDatabaseService.deleteNote(noteId);
      
      // Recharger l'adresse
      const updated = AddressDatabaseService.findAddress(selectedAddress!);
      if (updated) {
        setSelectedAddress(updated);
      }
    } catch (error) {
      alert('Erreur lors de la suppression de la note');
    }
  };

  const handleVerifyAddress = () => {
    if (!selectedAddress) return;

    AddressDatabaseService.verifyAddress(selectedAddress.id, currentUser);
    
    // Recharger l'adresse
    const updated = AddressDatabaseService.findAddress(selectedAddress);
    if (updated) {
      setSelectedAddress(updated);
    }
  };

  const handleManualSubmit = () => {
    if (!manualAddress.street_name || !manualAddress.city) {
      alert('Veuillez remplir au minimum la rue et la ville');
      return;
    }

    const address: Address = {
      id: Date.now().toString(),
      street_number: manualAddress.street_number || '',
      street_name: manualAddress.street_name || '',
      postal_code: manualAddress.postal_code || '',
      city: manualAddress.city || '',
      country: manualAddress.country || 'France',
      full_address: CSVAddressService.normalizeFullAddress(manualAddress as Address)
    };

    // Ajouter à la base de données
    const enhanced = AddressDatabaseService.addOrUpdateAddress(address);
    onAddressSelect(address);
  };

  const handleSelectAddress = () => {
    if (selectedAddress) {
      onAddressSelect(selectedAddress);
    }
  };

  if (showAddressDetails && selectedAddress) {
    const stats = AddressDatabaseService.getAddressStats(selectedAddress.id);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Détails de l'adresse</h3>
          <button
            onClick={() => setShowAddressDetails(false)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Adresse principale */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin size={20} className="text-blue-600" />
                <h4 className="font-semibold text-gray-900">{selectedAddress.full_address}</h4>
                {selectedAddress.isVerified && (
                  <CheckCircle size={16} className="text-green-600" title="Adresse vérifiée" />
                )}
              </div>
              
              {selectedAddress.isVerified && selectedAddress.verifiedBy && (
                <p className="text-sm text-green-600">
                  Vérifiée par {selectedAddress.verifiedBy}
                </p>
              )}
            </div>
            
            {!selectedAddress.isVerified && (
              <button
                onClick={handleVerifyAddress}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
              >
                Vérifier
              </button>
            )}
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{stats.totalDeliveries}</div>
              <div className="text-xs text-gray-600">Livraisons</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{stats.successRate.toFixed(0)}%</div>
              <div className="text-xs text-gray-600">Réussite</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{stats.averageNotes}</div>
              <div className="text-xs text-gray-600">Notes</div>
            </div>
          </div>

          {/* Instructions d'accès */}
          {selectedAddress.accessInstructions && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle size={16} className="text-amber-600" />
                <span className="font-medium text-amber-800">Instructions d'accès</span>
              </div>
              <p className="text-sm text-amber-700">{selectedAddress.accessInstructions}</p>
            </div>
          )}

          {/* Contact */}
          {selectedAddress.contactInfo && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">Contact</h5>
              <div className="space-y-1 text-sm">
                {selectedAddress.contactInfo.contactPerson && (
                  <div className="flex items-center space-x-2">
                    <User size={14} className="text-gray-500" />
                    <span>{selectedAddress.contactInfo.contactPerson}</span>
                  </div>
                )}
                {selectedAddress.contactInfo.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone size={14} className="text-gray-500" />
                    <span>{selectedAddress.contactInfo.phone}</span>
                  </div>
                )}
                {selectedAddress.contactInfo.email && (
                  <div className="flex items-center space-x-2">
                    <Mail size={14} className="text-gray-500" />
                    <span>{selectedAddress.contactInfo.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-medium text-gray-900 flex items-center space-x-2">
              <MessageSquare size={16} />
              <span>Notes partagées ({selectedAddress.notes.length})</span>
            </h5>
          </div>

          {/* Ajouter une note */}
          <div className="mb-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ajouter une note (visible par tous)..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Liste des notes */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {selectedAddress.notes.length > 0 ? (
              selectedAddress.notes.map((note) => (
                <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                  {editingNote === note.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editNoteText}
                        onChange={(e) => setEditNoteText(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveEditNote}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Sauvegarder
                        </button>
                        <button
                          onClick={() => setEditingNote(null)}
                          className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-900 mb-2">{note.note}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <User size={12} />
                          <span>{note.author}</span>
                          <Clock size={12} />
                          <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditNote(note.id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Aucune note pour cette adresse</p>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex space-x-3">
          <button
            onClick={handleSelectAddress}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Check size={20} />
            <span>Sélectionner cette adresse</span>
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (manualMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Nouvelle adresse</h3>
          <button
            onClick={() => setManualMode(false)}
            className="text-blue-600 hover:text-blue-700"
          >
            Recherche automatique
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="N°"
            value={manualAddress.street_number}
            onChange={(e) => setManualAddress({...manualAddress, street_number: e.target.value})}
            className="p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Rue *"
            value={manualAddress.street_name}
            onChange={(e) => setManualAddress({...manualAddress, street_name: e.target.value})}
            className="col-span-2 p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Code postal"
            value={manualAddress.postal_code}
            onChange={(e) => setManualAddress({...manualAddress, postal_code: e.target.value})}
            className="p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Ville *"
            value={manualAddress.city}
            onChange={(e) => setManualAddress({...manualAddress, city: e.target.value})}
            className="p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleManualSubmit}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Check size={20} />
            <span>Créer l'adresse</span>
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une adresse..."
            className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full p-4 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex items-start space-x-3"
              >
                <div className="flex items-center space-x-2">
                  <MapPin size={16} className="text-blue-600 flex-shrink-0" />
                  {suggestion.isLocal && (
                    <Star size={14} className="text-yellow-500" title="Adresse enregistrée" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {suggestion.isLocal ? suggestion.full_address : suggestion.display_name}
                  </p>
                  {suggestion.isLocal && suggestion.notes.length > 0 && (
                    <p className="text-sm text-blue-600">
                      {suggestion.notes.length} note(s) disponible(s)
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setManualMode(true)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
        >
          <Plus size={16} />
          <span>Nouvelle adresse</span>
        </button>
        
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
      </div>

      {query.length > 0 && query.length < 3 && (
        <p className="text-sm text-gray-500">Tapez au moins 3 caractères pour rechercher</p>
      )}
    </div>
  );
};