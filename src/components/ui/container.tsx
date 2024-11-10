export const Container = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`container mx-auto ${className}`}>
    {children}
  </div>
);
