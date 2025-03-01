
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot"; // Make sure Slot is imported

import { cn } from "@/lib/utils";

interface SidebarProps {
  children?: React.ReactNode;
  className?: string;
}

const Sidebar = ({ className, children, ...props }: SidebarProps) => {
  return (
    <aside
      className={cn(
        "group fixed inset-y-0 left-0 z-30 flex h-full flex-col border-r bg-background transition-all lg:w-64 lg:translate-x-0 data-[collapsed=true]:w-[60px] data-[collapsed=false]:w-64 md:-translate-x-0 -translate-x-full",
        className
      )}
      data-collapsed="false"
      {...props}
    >
      {children}
    </aside>
  );
};

interface SidebarHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

const SidebarHeader = ({ children, className, ...props }: SidebarHeaderProps) => {
  return (
    <header
      className={cn("flex h-[60px] items-center border-b px-2", className)}
      {...props}
    >
      {children}
    </header>
  );
};

interface SidebarContentProps {
  children?: React.ReactNode;
  className?: string;
}

const SidebarContent = ({
  children,
  className,
  ...props
}: SidebarContentProps) => {
  return (
    <div className={cn("flex-1 overflow-y-auto", className)} {...props}>
      {children}
    </div>
  );
};

interface SidebarFooterProps {
  children?: React.ReactNode;
  className?: string;
}

const SidebarFooter = ({ children, className, ...props }: SidebarFooterProps) => {
  return (
    <footer className={cn("border-t p-2", className)} {...props}>
      {children}
    </footer>
  );
};

interface SidebarGroupProps {
  children?: React.ReactNode;
  className?: string;
}

const SidebarGroup = ({ children, className, ...props }: SidebarGroupProps) => {
  return (
    <div className={cn("py-2", className)} {...props}>
      {children}
    </div>
  );
};

interface SidebarGroupLabelProps {
  children?: React.ReactNode;
  className?: string;
}

const SidebarGroupLabel = ({
  children,
  className,
  ...props
}: SidebarGroupLabelProps) => {
  return (
    <div
      className={cn(
        "px-2 pb-1 text-xs font-medium text-muted-foreground group-[[data-collapsed=true]]:text-transparent",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface SidebarGroupContentProps {
  children?: React.ReactNode;
  className?: string;
}

const SidebarGroupContent = ({
  children,
  className,
  ...props
}: SidebarGroupContentProps) => {
  return (
    <div className={cn("space-y-1 px-1", className)} {...props}>
      {children}
    </div>
  );
};

interface SidebarMenuProps {
  children?: React.ReactNode;
  className?: string;
}

const SidebarMenu = ({ children, className, ...props }: SidebarMenuProps) => {
  return (
    <div className={cn("block", className)} {...props}>
      {children}
    </div>
  );
};

interface SidebarMenuItemProps {
  children?: React.ReactNode;
  className?: string;
}

const SidebarMenuItem = ({
  children,
  className,
  ...props
}: SidebarMenuItemProps) => {
  return (
    <div className={cn("block", className)} {...props}>
      {children}
    </div>
  );
};

interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean; // Add the asChild prop
  className?: string;
}

// Update the SidebarMenuButton component to handle the asChild prop using Slot
const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={cn(
        "flex w-full cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground group-[[data-collapsed=true]]:justify-center",
        className
      )}
      {...props}
    />
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

interface SidebarTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  SidebarTriggerProps
>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <path d="M9 3v18" />
        <path d="m16 15-3-3 3-3" />
      </svg>
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

interface SidebarProviderContextType {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarProviderContext = React.createContext<
  SidebarProviderContextType | undefined
>(undefined);

interface SidebarProviderProps {
  children: React.ReactNode;
}

const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <SidebarProviderContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarProviderContext.Provider>
  );
};

function useSidebar() {
  const context = React.useContext(SidebarProviderContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarProvider,
  useSidebar,
};
