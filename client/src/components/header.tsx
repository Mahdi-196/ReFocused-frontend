import { Menu } from 'lucide-react';

const header = () => {
    return (
      <header className="bg-[var(--color-background)] p-5 relative flex justify-center items-center">
        <h1 className="text-[var(--color-primary1)] text-4xl font-bold text-center">
          Focus shift
        </h1>
        <Menu className="w-8 h-8 text-[var(--color-primary1)] absolute right-5" >
        {/* onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)} */}
        </Menu>

      </header>
    );
  };
  
  

export default header