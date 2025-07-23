import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface Package {
  id: string;
  status: 'pending' | 'delivered' | 'failed';
  address: {
    full_address: string;
  };
  location: string;
  barcode?: string;
  timestamp: Date;
}

export interface Vehicle {
  licensePlate: string;
  brand: string;
  model: string;
  mileage: number;
  fuelType: string;
}

export interface AppState {
  packages: Package[];
  currentVehicle: Vehicle | null;
  activeTab: 'today' | 'scan' | 'gps' | 'history';
  user: any | null;
  loading: boolean;
  error: string | null;
}

export type AppAction =
  | { type: 'ADD_PACKAGE'; payload: Package }
  | { type: 'UPDATE_PACKAGE'; payload: { id: string; updates: Partial<Package> } }
  | { type: 'SET_VEHICLE'; payload: Vehicle }
  | { type: 'SET_ACTIVE_TAB'; payload: AppState['activeTab'] }
  | { type: 'SET_USER'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: AppState = {
  packages: [],
  currentVehicle: null,
  activeTab: 'today',
  user: null,
  loading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_PACKAGE':
      return {
        ...state,
        packages: [...state.packages, action.payload],
      };
    case 'UPDATE_PACKAGE':
      return {
        ...state,
        packages: state.packages.map(pkg =>
          pkg.id === action.payload.id
            ? { ...pkg, ...action.payload.updates }
            : pkg
        ),
      };
    case 'SET_VEHICLE':
      return {
        ...state,
        currentVehicle: action.payload,
      };
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Convenience hooks
export function usePackages() {
  const { state, dispatch } = useAppContext();
  
  const addPackage = (packageData: Omit<Package, 'id' | 'timestamp'>) => {
    const newPackage: Package = {
      ...packageData,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_PACKAGE', payload: newPackage });
  };

  const updatePackage = (id: string, updates: Partial<Package>) => {
    dispatch({ type: 'UPDATE_PACKAGE', payload: { id, updates } });
  };

  const getPackagesByStatus = (status: Package['status']) => {
    return state.packages.filter(pkg => pkg.status === status);
  };

  return {
    packages: state.packages,
    addPackage,
    updatePackage,
    getPackagesByStatus,
  };
}