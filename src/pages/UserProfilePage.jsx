import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'
import HeroSection from '../components/HeroSection'
import ProjectsPage from '../components/ProjectsPage'
import AboutPage from '../components/AboutPage'
import SkillsetPage from '../components/SkillsetPage'
import Footer from '../components/Footer'
import LightRays from '../components/LightRays'
import MusicWarning from '../components/MusicWarning'
import LayoutStyles from '../components/LayoutStyles'
import ParticleEffects from '../components/effects/ParticleEffects'
import GlitchEffect from '../components/effects/GlitchEffect'
import NeonGlow from '../components/effects/NeonGlow'
import MatrixRain from '../components/effects/MatrixRain'
import FloatingShapes from '../components/effects/FloatingShapes'
import { Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function UserProfilePage() {
  const { username } = useParams()
  const { isAuthenticated, profile } = useAuth()
  const navigate = useNavigate()
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState(null)
  const [showMusicWarning, setShowMusicWarning] = useState(false)
  const [musicAccepted, setMusicAccepted] = useState(false)

  // 1. Profil laden (ohne Endlosschleife)
  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      try {
        console.log('[UserProfilePage] Loading profile for username/alias:', username)

        // Suche 1: Kleingeschriebener Username
        const { data: usernameData } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username.toLowerCase())
            .maybeSingle()

        let foundData = usernameData

        // Suche 2: Exakte Schreibweise
        if (!foundData) {
          const { data: caseData } = await supabase
              .from('profiles')
              .select('*')
              .eq('username', username)
              .maybeSingle()

          foundData = caseData
        }

        // Suche 3: Page-Alias
        if (!foundData) {
          const { data: aliasData } = await supabase
              .from('profiles')
              .select('*')

          if (aliasData) {
            foundData = aliasData.find(p => {
              const alias = p.config?.premium_features?.page_alias
              return alias && alias.toLowerCase() === username.toLowerCase()
            })
          }
        }

        if (!foundData) {
          console.log('[UserProfilePage] Profile not found by username or alias')
          if (isMounted) {
            setUserProfile(null)
            setConfig(null)
          }
          return
        }

        if (isMounted) {
          console.log('[UserProfilePage] Profile loaded:', foundData.username)

          const isOwner = isAuthenticated && profile?.id === foundData.id
          if (!isOwner && foundData.is_active === false) {
            navigate('/')
            return
          }

          setUserProfile(foundData)

          if (foundData.config && typeof foundData.config === 'object') {
            setConfig(foundData.config)

            if (foundData.config.music_enabled && foundData.config.music_url && !musicAccepted) {
              setShowMusicWarning(true)
            }
          } else {
            setConfig(getDefaultConfig(foundData))
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('[UserProfilePage] Error loading profile:', error)
          setUserProfile(null)
          setConfig(null)
          setShowMusicWarning(false)
          setMusicAccepted(false)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    const getDefaultConfig = (profileData) => ({
      hero_title: '',
      hero_subtitle: '',
      hero_description: '',
      about_title: '',
      about_description: '',
      background_image_url: '',
      about_bg_image_url: '',
      projects_bg_image_url: '',
      skillset_bg_image_url: '',
      profile_image_url: '',
      github_url: '',
      telegram_url: '',
      discord_url: '',
      linkedin_url: '',
      twitter_url: '',
      instagram_url: '',
      youtube_url: '',
      website_url: '',
      email: profileData?.email || '',
      location: '',
      timezone: 'Asia/Kolkata',
      show_date: true,
      show_time: true,
      header_items: [],
      active_projects: [],
      active_projects_description: '',
      upcoming_projects: [],
      upcoming_projects_description: '',
      skillsets: [],
      github_token: '',
      wakatime_token: '',
      styles: {},
      layout: {
        hero: { order: 0, width: 100, height: 100 },
        about: { order: 1, width: 100, height: 100 },
        projects: { order: 2, width: 100, height: 100 },
        skillset: { order: 3, width: 100, height: 100 }
      },
      section_visibility: {
        hero: true,
        about: true,
        projects: true,
        skillset: true,
        footer: true
      },
      section_backgrounds: {
        hero: 'none',
        about: 'dots',
        projects: 'grid',
        skillset: 'dots'
      }
    })

    if (username) {
      loadProfile()
    } else {
      setLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [username])

  // 2. Profile Views tracken (ohne Re-Render-Loop)
  useEffect(() => {
    if (!userProfile?.id || loading) return

    const isOwner = isAuthenticated && profile?.username === username
    if (isOwner) return

    const viewKey = `view_${userProfile.id}`
    const sessionViewKey = `session_view_${userProfile.id}`
    const viewCooldown = 24 * 60 * 60 * 1000

    const sessionViewed = sessionStorage.getItem(sessionViewKey)
    const lastViewTime = localStorage.getItem(viewKey)
    const now = Date.now()

    const shouldTrackView = !sessionViewed && (!lastViewTime || (now - parseInt(lastViewTime)) > viewCooldown)

    if (shouldTrackView) {
      const trackView = async () => {
        try {
          const { error } = await supabase.rpc('increment_view_count', { profile_id: userProfile.id })
          if (!error) {
            sessionStorage.setItem(sessionViewKey, 'true')
            localStorage.setItem(viewKey, now.toString())
          }
        } catch (err) {
          console.error('Failed to track view:', err)
        }
      }
      trackView()
    }
  }, [userProfile?.id, loading])

  // 3. Custom Fonts
  useEffect(() => {
    if (!config || !userProfile) return

    const customFontsEnabled = config.premium_features?.custom_fonts_enabled
    const customFontUrl = config.premium_features?.custom_font_url
    const customFontFamily = config.premium_features?.custom_font_family
    const isPremium = userProfile?.is_premium === true && (!userProfile?.premium_expires_at || new Date(userProfile.premium_expires_at) > new Date())

    if (customFontsEnabled && customFontUrl && customFontFamily && isPremium) {
      const linkId = 'custom-font-link'
      let fontLink = document.getElementById(linkId)

      if (!fontLink) {
        fontLink = document.createElement('link')
        fontLink.id = linkId
        fontLink.rel = 'stylesheet'
        document.head.appendChild(fontLink)
      }

      fontLink.href = customFontUrl

      const styleId = 'custom-font-style'
      let fontStyle = document.getElementById(styleId)

      if (!fontStyle) {
        fontStyle = document.createElement('style')
        fontStyle.id = styleId
        document.head.appendChild(fontStyle)
      }

      fontStyle.textContent = `
        body, * {
          font-family: "${customFontFamily}", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
        }
      `

      return () => {
        if (fontLink) fontLink.remove()
        if (fontStyle) fontStyle.remove()
      }
    } else {
      const linkId = 'custom-font-link'
      const styleId = 'custom-font-style'
      const fontLink = document.getElementById(linkId)
      const fontStyle = document.getElementById(styleId)
      if (fontLink) fontLink.remove()
      if (fontStyle) fontStyle.remove()
    }
  }, [config, userProfile])

  // 4. SEO & Metadata
  useEffect(() => {
    if (!config || !userProfile) return

    const metadata = config.premium_features?.metadata
    const seo = config.premium_features?.seo

    if (metadata || seo) {
      const isPremium = userProfile?.is_premium === true && (!userProfile?.premium_expires_at || new Date(userProfile.premium_expires_at) > new Date())

      if (isPremium) {
        if (metadata?.page_title) {
          document.title = metadata.page_title
        } else if (userProfile?.display_name) {
          document.title = `${userProfile.display_name} - ${userProfile.username}`
        }

        const updateMetaTag = (name, content, attribute = 'name') => {
          if (!content) return
          let tag = document.querySelector(`meta[${attribute}="${name}"]`)
          if (!tag) {
            tag = document.createElement('meta')
            tag.setAttribute(attribute, name)
            document.head.appendChild(tag)
          }
          tag.setAttribute('content', content)
        }

        if (metadata?.meta_description) updateMetaTag('description', metadata.meta_description)
        if (metadata?.meta_keywords) updateMetaTag('keywords', metadata.meta_keywords)

        if (metadata?.og_title) {
          updateMetaTag('og:title', metadata.og_title, 'property')
        } else if (metadata?.page_title) {
          updateMetaTag('og:title', metadata.page_title, 'property')
        }

        if (metadata?.og_description) {
          updateMetaTag('og:description', metadata.og_description, 'property')
        } else if (metadata?.meta_description) {
          updateMetaTag('og:description', metadata.meta_description, 'property')
        }

        const ogImage = metadata?.og_image
        if (ogImage) updateMetaTag('og:image', ogImage, 'property')

        updateMetaTag('og:type', 'website', 'property')
        updateMetaTag('og:url', window.location.href, 'property')

        if (metadata?.twitter_card) updateMetaTag('twitter:card', metadata.twitter_card)

        if (seo?.custom_canonical) {
          let canonical = document.querySelector('link[rel="canonical"]')
          if (!canonical) {
            canonical = document.createElement('link')
            canonical.setAttribute('rel', 'canonical')
            document.head.appendChild(canonical)
          }
          canonical.setAttribute('href', seo.custom_canonical)
        }

        if (seo?.robots) updateMetaTag('robots', seo.robots)

        if (seo?.custom_head) {
          const customHeadId = 'custom-head-seo'
          let customHeadElement = document.getElementById(customHeadId)
          if (!customHeadElement) {
            customHeadElement = document.createElement('div')
            customHeadElement.id = customHeadId
            customHeadElement.style.display = 'none'
            document.head.appendChild(customHeadElement)
          }
          customHeadElement.innerHTML = seo.custom_head

          const scripts = customHeadElement.querySelectorAll('script')
          scripts.forEach((script) => {
            const newScript = document.createElement('script')
            Array.from(script.attributes).forEach((attr) => {
              newScript.setAttribute(attr.name, attr.value)
            })
            newScript.textContent = script.textContent
            document.head.appendChild(newScript)
            script.remove()
          })

          const links = customHeadElement.querySelectorAll('link')
          links.forEach((link) => {
            if (!document.querySelector(`link[href="${link.getAttribute('href')}"]`)) {
              document.head.appendChild(link.cloneNode(true))
            }
            link.remove()
          })

          const styles = customHeadElement.querySelectorAll('style')
          styles.forEach((style) => {
            if (!document.querySelector(`style[data-custom-head]`)) {
              const newStyle = style.cloneNode(true)
              newStyle.setAttribute('data-custom-head', 'true')
              document.head.appendChild(newStyle)
            }
            style.remove()
          })
        }
      }
    }

    return () => {
      document.title = 'radium.lol - Create your customizable portfolio page'
    }
  }, [config, userProfile])

  // 5. Custom Cursor
  useEffect(() => {
    if (config?.cursor_icon_url) {
      const styleId = 'custom-cursor-style'
      let styleElement = document.getElementById(styleId)

      if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.id = styleId
        document.head.appendChild(styleElement)
      }

      styleElement.textContent = `
        * {
          cursor: url(${config.cursor_icon_url}), auto !important;
        }
        button, a, input, textarea, select {
          cursor: url(${config.cursor_icon_url}), pointer !important;
        }
      `

      return () => {
        const element = document.getElementById(styleId)
        if (element) element.remove()
      }
    }
  }, [config?.cursor_icon_url])

  if (loading) {
    return (
        <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-12 h-12">
              <div className="w-12 h-12 border-3 border-white/20 rounded-full"></div>
              <div className="w-12 h-12 border-3 border-white/50 border-t-white rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="text-sm text-gray-400">Loading profile...</p>
          </div>
        </div>
    )
  }

  if (!userProfile) {
    return (
        <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl mb-4">Profile Not Found</h1>
            <p className="text-gray-400 mb-4">The user "{username}" doesn't exist.</p>
            <Link to="/" className="text-orange-400 hover:text-orange-300">
              Go Home
            </Link>
          </div>
        </div>
    )
  }

  if (!config) {
    return (
        <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-12 h-12">
              <div className="w-12 h-12 border-3 border-white/20 rounded-full"></div>
              <div className="w-12 h-12 border-3 border-white/50 border-t-white rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="text-sm text-gray-400">Loading configuration...</p>
          </div>
        </div>
    )
  }

  const isOwner = isAuthenticated && profile?.id === userProfile?.id

  const handleMusicAccept = () => {
    setMusicAccepted(true)
    setShowMusicWarning(false)
  }

  const handleMusicDecline = () => {
    setShowMusicWarning(false)
    setMusicAccepted(false)
    navigate('/')
  }

  if (showMusicWarning && config && config.music_enabled && config.music_url && !musicAccepted && !loading) {
    return (
        <MusicWarning
            config={config}
            onAccept={handleMusicAccept}
            onDecline={handleMusicDecline}
        />
    )
  }

  const specialEffects = config.premium_features?.special_effects || {}
  const isPremium = userProfile?.is_premium === true && (!userProfile?.premium_expires_at || new Date(userProfile.premium_expires_at) > new Date())

  return (
      <div className={`min-h-screen bg-black text-white font-mono overflow-x-hidden w-full max-w-full flex flex-col ${specialEffects.glitch_effect && isPremium ? 'glitch-effect' : ''} ${specialEffects.neon_glow && isPremium ? 'neon-glow-effect' : ''}`}>
        {config?.layout && <LayoutStyles layout={config.layout} />}
        {isPremium && specialEffects.particle_effects && <ParticleEffects />}
        {isPremium && specialEffects.glitch_effect && <GlitchEffect />}
        {isPremium && specialEffects.neon_glow && <NeonGlow />}
        {isPremium && specialEffects.matrix_rain && <MatrixRain />}
        {isPremium && specialEffects.floating_shapes && <FloatingShapes />}
        {userProfile?.is_premium && config.light_rays_enabled && (
            <LightRays
                raysOrigin={config.light_rays_origin || "top-center"}
                raysColor={config.light_rays_color || "#ffffff"}
                raysSpeed={config.light_rays_speed || 1}
                lightSpread={config.light_rays_spread || 1}
                rayLength={config.light_rays_length || 2}
                followMouse={config.light_rays_follow_mouse !== false}
                mouseInfluence={config.light_rays_mouse_influence || 0.15}
            />
        )}
        <Header
            username={userProfile.username}
            displayName={userProfile.display_name}
            config={config}
            userProfile={userProfile}
            musicAccepted={musicAccepted || isOwner}
        />
        {isOwner && (
            <Link
                to="/dashboard"
                className="group fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-orange-500/10 hover:from-orange-500/20 hover:via-orange-500/10 hover:to-orange-500/20 hover:border-orange-500/50 transition-all duration-300 backdrop-blur-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:scale-105"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Sparkles className="w-5 h-5 text-orange-300 relative z-10 group-hover:rotate-12 transition-transform" />
              </div>
              <span className="font-semibold text-white relative z-10">Dashboard</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Link>
        )}
        <main className="w-full max-w-full overflow-x-hidden flex-1">
          {config.section_visibility?.hero !== false && (
              <div
                  className="hero-background w-full max-w-full"
                  style={{
                    backgroundImage: config.background_image_url
                        ? `url(${config.background_image_url})`
                        : 'none'
                  }}
              >
                <HeroSection config={config} />
              </div>
          )}
          {config.section_visibility?.about !== false && (
              <div className={`w-full max-w-full pattern-${config.section_backgrounds?.about || 'dots'}`}>
                <AboutPage config={config} userProfile={userProfile} />
              </div>
          )}
          {config.section_visibility?.projects !== false && (
              <div className={`w-full max-w-full pattern-${config.section_backgrounds?.projects || 'grid'}`}>
                <ProjectsPage config={config} />
              </div>
          )}
          {config.section_visibility?.skillset !== false && (
              <div className={`w-full max-w-full pattern-${config.section_backgrounds?.skillset || 'dots'}`}>
                <SkillsetPage config={config} />
              </div>
          )}
        </main>
        {config.section_visibility?.footer !== false && (
            <Footer config={config} />
        )}
      </div>
  )
}