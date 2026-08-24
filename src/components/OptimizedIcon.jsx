import dynamic from 'next/dynamic';
import { memo } from 'react';

// Dynamically import only the icons we need
const iconMap = {
  Grid: dynamic(() => import('react-feather').then(mod => ({ default: mod.Grid })), { 
    ssr: false,
    loading: () => <div className="icon-placeholder" />
  }),
  Box: dynamic(() => import('react-feather').then(mod => ({ default: mod.Box })), { 
    ssr: false,
    loading: () => <div className="icon-placeholder" />
  }),
  ArrowUp: dynamic(() => import('react-feather').then(mod => ({ default: mod.ArrowUp })), { 
    ssr: false,
    loading: () => <div className="icon-placeholder" />
  }),
  Database: dynamic(() => import('react-feather').then(mod => ({ default: mod.Database })), { 
    ssr: false,
    loading: () => <div className="icon-placeholder" />
  }),
  ArrowRight: dynamic(() => import('react-feather').then(mod => ({ default: mod.ArrowRight })), { 
    ssr: false,
    loading: () => <div className="icon-placeholder" />
  }),
  Users: dynamic(() => import('react-feather').then(mod => ({ default: mod.Users })), { 
    ssr: false,
    loading: () => <div className="icon-placeholder" />
  }),
  FileText: dynamic(() => import('react-feather').then(mod => ({ default: mod.FileText })), { 
    ssr: false,
    loading: () => <div className="icon-placeholder" />
  }),
  CreditCard: dynamic(() => import('react-feather').then(mod => ({ default: mod.CreditCard })), { 
    ssr: false,
    loading: () => <div className="icon-placeholder" />
  }),
  MapPin: dynamic(() => import('react-feather').then(mod => ({ default: mod.MapPin })), { 
    ssr: false,
    loading: () => <div className="icon-placeholder" />
  }),
  Shield: dynamic(() => import('react-feather').then(mod => ({ default: mod.Shield })), { 
    ssr: false,
    loading: () => <div className="icon-placeholder" />
  }),
  CheckCircle: dynamic(() => import('react-feather').then(mod => ({ default: mod.CheckCircle })), { 
    ssr: false,
    loading: () => <div className="icon-placeholder" />
  }),
  List: dynamic(() => import('react-feather').then(mod => ({ default: mod.List })), { 
    ssr: false,
    loading: () => <div className="icon-placeholder" />
  }),
};

const OptimizedIcon = memo(({ name, ...props }) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return <div className="icon-placeholder" />;
  }
  
  return <IconComponent {...props} />;
});

OptimizedIcon.displayName = 'OptimizedIcon';

export default OptimizedIcon;
