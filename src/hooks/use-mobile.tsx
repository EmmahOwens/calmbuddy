
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Check on initial render
    checkMobile()
    
    // Add event listeners for resize and orientation change
    window.addEventListener("resize", checkMobile)
    window.addEventListener("orientationchange", checkMobile)
    
    // Create media query list and add listener
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    if (mql.addEventListener) {
      mql.addEventListener("change", checkMobile)
    } else {
      // Fallback for older browsers
      mql.addListener(checkMobile)
    }
    
    return () => {
      window.removeEventListener("resize", checkMobile)
      window.removeEventListener("orientationchange", checkMobile)
      
      if (mql.removeEventListener) {
        mql.removeEventListener("change", checkMobile)
      } else {
        // Fallback for older browsers
        mql.removeListener(checkMobile)
      }
    }
  }, [])

  return !!isMobile
}
