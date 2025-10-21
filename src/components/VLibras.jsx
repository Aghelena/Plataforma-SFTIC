import { useEffect } from 'react'

/**
 * VLibrasProvider
 * - Injects the required container and script once
 * - Initializes the widget on mount
 * - Leaves the widget available globally (common behavior on sites)
 */
export default function VLibrasProvider(){
  useEffect(() => {
    // Container (if not present)
    if(!document.querySelector('[vw]')){
      const wrap = document.createElement('div')
      wrap.setAttribute('vw', '')
      wrap.className = 'enabled'
      wrap.innerHTML = `
        <div vw-access-button class="active"></div>
        <div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>
      `
      document.body.appendChild(wrap)
    }

    // Load script only once
    const already = document.querySelector('script[data-vlibras]')
    const init = () => {
      if(window.VLibras && !window.__vlibrasWidget){
        window.__vlibrasWidget = new window.VLibras.Widget('https://vlibras.gov.br/app')
      }
    }
    if(!already){
      const s = document.createElement('script')
      s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js'
      s.async = true
      s.setAttribute('data-vlibras','1')
      s.onload = init
      document.body.appendChild(s)
    } else {
      init()
    }
  }, [])

  return null
}
