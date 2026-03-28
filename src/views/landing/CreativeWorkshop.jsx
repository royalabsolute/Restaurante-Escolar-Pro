import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Toolbar,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material';
import {
  ArrowDownward,
  ArrowUpward,
  Add,
  Article,
  AutoAwesome,
  BlurOn,
  ColorLens,
  ContentCopy,
  CropSquare,
  Delete,
  FlipToBack,
  FlipToFront,
  FormatListBulleted,
  FormatQuote,
  Groups,
  GridOn,
  Image,
  PlayCircleOutline,
  QueryStats,
  RemoveCircleOutline,
  SmartButton,
  Stars,
  Timeline,
  Title,
  ViewCarousel
} from '@mui/icons-material';

const CANVAS_PRESETS = [
  {
    id: 'midnight',
    label: 'Azul sereno',
    background: 'linear-gradient(135deg, #E3F2FF 0%, #F8FBFF 100%)',
    decoration: 'grid'
  },
  {
    id: 'sunrise',
    label: 'Atardecer cálido',
    background: 'linear-gradient(135deg, #FFF4E6 0%, #FFE1CC 48%, #FFD1D9 100%)',
    decoration: 'particles'
  },
  {
    id: 'canvas',
    label: 'Lienzo neutro',
    background: '#FFFFFF',
    decoration: 'none'
  },
  {
    id: 'forest',
    label: 'Verde equilibrio',
    background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 55%, #DCFCE7 100%)',
    decoration: 'stars'
  }
];

const ELEMENT_TEMPLATES = {
  hero: {
    label: 'Bloque hero',
    description: 'Sección principal para impactar al visitante.',
    props: {
      width: 720,
      height: 320,
      backgroundColor: 'linear-gradient(135deg, rgba(74,144,226,0.95), rgba(56,189,248,0.9))',
      textColor: '#0F172A',
      heading: 'Presenta tu idea central',
      body: 'Explica el impacto, la solución y el beneficio para la comunidad educativa.',
      fontSize: 30,
      x: 140,
      y: 80,
      borderRadius: 28,
      borderWidth: 0,
      borderColor: 'transparent',
      shadow: true,
  alignment: 'left',
  linkUrl: ''
    }
  },
  headline: {
    label: 'Título grande',
    description: 'Ideal para secciones y titulares poderosos.',
    props: {
      width: 420,
      height: 120,
      backgroundColor: 'transparent',
      textColor: '#0F172A',
  heading: 'Encabezado de sección',
      body: '',
      fontSize: 40,
      x: 160,
      y: 120,
      borderRadius: 0,
      borderWidth: 0,
      borderColor: 'transparent',
      shadow: false,
      alignment: 'left'
    }
  },
  paragraph: {
    label: 'Bloque de texto',
    description: 'Para explicar ideas, problemas o testimonios.',
    props: {
      width: 380,
      height: 200,
      backgroundColor: '#FFFFFF',
      textColor: '#1E293B',
      heading: 'Idea principal desarrollada',
      body: 'Detalla tu propuesta con ejemplos, historias o estadísticas. Alinea el mensaje con la misión de la institución.',
      fontSize: 18,
      x: 520,
      y: 220,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(148,163,184,0.35)',
      shadow: false,
      alignment: 'left'
    }
  },
  feature: {
    label: 'Caja destacada',
    description: 'Un contenedor versátil para beneficios o módulos.',
    props: {
      width: 360,
      height: 240,
      backgroundColor: '#FFFFFF',
      textColor: '#1E293B',
      heading: 'Beneficio clave',
      body: 'Resume el aporte más relevante de tu proyecto. Refuerza con un mensaje directo y medible.',
      fontSize: 20,
      x: 820,
      y: 120,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: 'rgba(226,232,240,0.9)',
      shadow: true,
  alignment: 'left',
  linkUrl: ''
    }
  },
  image: {
    label: 'Marco de imagen',
    description: 'Muestra prototipos, fotos o renders.',
    props: {
      width: 320,
      height: 220,
  backgroundColor: '#E0F2FF',
  textColor: '#1A1A1A',
  heading: 'Añade evidencia visual',
      body: '',
      fontSize: 18,
      x: 160,
      y: 340,
      imageUrl: 'https://source.unsplash.com/collection/404339/640x480',
      borderRadius: 24,
      borderWidth: 0,
      borderColor: 'rgba(255,255,255,0.6)',
      shadow: false,
      alignment: 'center'
    }
  },
  button: {
    label: 'Botón CTA',
    description: 'Invita a inscribirse o conocer más.',
    props: {
      width: 240,
      height: 72,
      backgroundColor: '#4A90E2',
      textColor: '#FFFFFF',
      heading: 'Explorar propuesta',
      body: '',
      fontSize: 22,
      x: 560,
      y: 440,
      borderRadius: 18,
      borderWidth: 0,
      borderColor: '#2B6CB0',
      shadow: true,
  alignment: 'center',
  linkUrl: 'https://'
    }
  },
  separator: {
    label: 'Separador / forma',
    description: 'Línea o bloque decorativo para dividir secciones.',
    props: {
      width: 600,
      height: 16,
  backgroundColor: 'rgba(148,163,184,0.45)',
  textColor: '#0F172A',
      heading: '',
      body: '',
      fontSize: 14,
      x: 200,
      y: 520,
      borderRadius: 999,
      borderWidth: 0,
      borderColor: 'transparent',
      shadow: false,
      alignment: 'center'
    }
  },
  badge: {
    label: 'Insignia / chip',
    description: 'Ideal para logros, premios o valores.',
    props: {
      width: 200,
      height: 64,
      backgroundColor: '#FFE08A',
      textColor: '#0F172A',
      heading: 'Innovación educativa',
      body: '',
      fontSize: 18,
      x: 880,
      y: 380,
      borderRadius: 999,
      borderWidth: 0,
      borderColor: 'rgba(17,24,39,0.15)',
      shadow: false,
      alignment: 'center'
    }
  },
  quote: {
    label: 'Frase inspiradora',
    description: 'Comparte una cita o testimonio breve.',
    props: {
      width: 480,
      height: 260,
      backgroundColor: '#FFFFFF',
      textColor: '#0F172A',
      heading: 'Nombre de quien habla',
      body: '"Comparte una frase que motive a tu audiencia."',
      fontSize: 24,
      x: 500,
      y: 520,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: 'rgba(148,163,184,0.28)',
      shadow: true,
      alignment: 'left'
    }
  },
  checklist: {
    label: 'Lista de chequeo',
    description: 'Resume pasos o compromisos clave.',
    props: {
      width: 420,
      height: 280,
      backgroundColor: '#F8FAFC',
      textColor: '#0F172A',
      heading: 'Checklist del proyecto',
      body: 'Definir la necesidad\nOrganizar el equipo\nDiseñar la solución\nPresentar resultados',
      fontSize: 20,
      x: 920,
      y: 520,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(148,163,184,0.35)',
      shadow: false,
      alignment: 'left'
    }
  },
  stat: {
    label: 'Dato clave',
    description: 'Destaca una cifra que respalda tu idea.',
    props: {
      width: 320,
      height: 220,
      backgroundColor: '#1D4ED8',
      textColor: '#FFFFFF',
      heading: '85%',
      body: 'De estudiantes que respaldan la propuesta después del piloto.',
      fontSize: 48,
      x: 680,
      y: 340,
      borderRadius: 32,
      borderWidth: 0,
      borderColor: 'transparent',
      shadow: true,
      alignment: 'center',
      linkUrl: ''
    }
  },
  timeline: {
    label: 'Línea de tiempo',
    description: 'Ordena los momentos clave de tu proyecto.',
    props: {
      width: 520,
      height: 320,
      backgroundColor: '#FFFFFF',
      textColor: '#0F172A',
      heading: 'Ruta del proyecto',
      body: 'Fase 1: Investigación\nFase 2: Pruebas en aula\nFase 3: Ajustes y socialización\nFase 4: Lanzamiento institucional',
      fontSize: 22,
      x: 260,
      y: 640,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: 'rgba(148,163,184,0.3)',
      shadow: false,
      alignment: 'left'
    }
  },
  circle: {
    label: 'Burbuja de color',
    description: 'Forma decorativa para resaltar secciones.',
    props: {
      width: 220,
      height: 220,
      backgroundColor: 'linear-gradient(145deg, #38BDF8, #6366F1)',
      textColor: '#FFFFFF',
      heading: '',
      body: '',
      fontSize: 18,
      x: 1040,
      y: 180,
      borderRadius: 999,
      borderWidth: 0,
      borderColor: 'transparent',
      shadow: true,
      alignment: 'center'
    }
  },
  video: {
    label: 'Video / mockup',
    description: 'Simula un reproductor para mostrar prototipos.',
    props: {
      width: 540,
      height: 320,
      backgroundColor: '#0F172A',
      textColor: '#F8FAFC',
      heading: 'Demo del proyecto',
      body: 'Describe lo que verían al reproducir tu video o animación.',
      fontSize: 24,
      x: 360,
      y: 160,
      borderRadius: 28,
      borderWidth: 0,
      borderColor: 'transparent',
  shadow: true,
  alignment: 'center',
  linkUrl: 'https://'
    }
  },
  avatarStrip: {
    label: 'Equipo / aliados',
    description: 'Presenta quiénes participan en la propuesta.',
    props: {
      width: 420,
      height: 180,
      backgroundColor: '#FFFFFF',
      textColor: '#0F172A',
      heading: 'Equipo impulsor',
      body: 'María – Docente líder',
      fontSize: 18,
      x: 880,
      y: 640,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(148,163,184,0.3)',
      shadow: false,
      alignment: 'left'
    }
  },
  carousel: {
    label: 'Galería destacada',
    description: 'Resume tres evidencias o hitos.',
    props: {
      width: 620,
      height: 260,
      backgroundColor: '#FFFFFF',
      textColor: '#0F172A',
      heading: 'Hitos visuales',
      body: 'Foto 1: Diagnóstico\nFoto 2: Taller de co-creación\nFoto 3: Presentación final',
      fontSize: 20,
      x: 280,
      y: 440,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: 'rgba(148,163,184,0.28)',
      shadow: false,
      alignment: 'left'
    }
  },
  palette: {
    label: 'Tira informativa',
    description: 'Combina color, iconos y texto breve para resúmenes.',
    props: {
      width: 640,
      height: 160,
      backgroundColor: 'linear-gradient(120deg, #4A90E2, #6366F1)',
      textColor: '#FFFFFF',
      heading: 'Mensaje clave para la comunidad',
      body: 'Describe en una frase qué lograrán si apoyan tu proyecto.',
      fontSize: 24,
      x: 320,
      y: 720,
      borderRadius: 28,
      borderWidth: 0,
    borderColor: 'transparent',
    shadow: true,
    alignment: 'center',
    linkUrl: ''
    }
  }
};

const TOOLBAR_SECTIONS = [
  {
    label: 'Texto',
    items: [
      { type: 'hero', label: 'Bloque hero', icon: AutoAwesome, description: 'Bloque completo para captar la atención.' },
      { type: 'headline', label: 'Título grande', icon: Title, description: 'Titular para comenzar una sección.' },
      { type: 'paragraph', label: 'Texto largo', icon: Article, description: 'Describe la historia detrás del proyecto.' },
      { type: 'quote', label: 'Frase inspiradora', icon: FormatQuote, description: 'Incluye testimonios o citas con intención.' },
      { type: 'checklist', label: 'Lista de chequeo', icon: FormatListBulleted, description: 'Organiza pasos, acuerdos o compromisos.' }
    ]
  },
  {
    label: 'Visual',
    items: [
      { type: 'feature', label: 'Caja destacada', icon: CropSquare, description: 'Resalta un beneficio o módulo.' },
      { type: 'image', label: 'Imagen', icon: Image, description: 'Agrega fotos, prototipos o bocetos.' },
      { type: 'separator', label: 'Separador', icon: CropSquare, description: 'Divide secciones o crea ritmo visual.' },
      { type: 'stat', label: 'Dato clave', icon: QueryStats, description: 'Muestra cifras que respalden tu propuesta.' },
      { type: 'timeline', label: 'Línea de tiempo', icon: Timeline, description: 'Cuenta la evolución del proyecto por fases.' },
      { type: 'video', label: 'Video / mockup', icon: PlayCircleOutline, description: 'Simula un reproductor o demo interactiva.' },
      { type: 'carousel', label: 'Galería', icon: ViewCarousel, description: 'Muestra hitos con un formato de tarjetas.' },
      { type: 'circle', label: 'Burbuja', icon: BlurOn, description: 'Añade formas orgánicas para equilibrar el diseño.' }
    ]
  },
  {
    label: 'Acción y estilo',
    items: [
      { type: 'button', label: 'Botón CTA', icon: SmartButton, description: 'Invita a tomar acción.' },
      { type: 'badge', label: 'Insignia', icon: Stars, description: 'Etiqueta logros o valores clave.' },
      { type: 'avatarStrip', label: 'Equipo', icon: Groups, description: 'Presenta a quienes lideran la propuesta.' },
      { type: 'palette', label: 'Tira informativa', icon: ColorLens, description: 'Combina color y texto para resúmenes.' }
    ]
  }
];

const FONT_OPTIONS = [
  { value: 16, label: '16 px' },
  { value: 18, label: '18 px' },
  { value: 22, label: '22 px' },
  { value: 28, label: '28 px' },
  { value: 32, label: '32 px' },
  { value: 40, label: '40 px' }
];

const ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Izquierda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Derecha' }
];

const HEIGHT_OPTIONS = [
  { value: 160, label: 'Compacto' },
  { value: 220, label: 'Medio' },
  { value: 320, label: 'Amplio' }
];

const defaultCanvas = {
  width: 1280,
  height: 900,
  background: CANVAS_PRESETS[0].background,
  decoration: CANVAS_PRESETS[0].decoration,
  presetId: CANVAS_PRESETS[0].id,
  backgroundImage: '',
  showGrid: true
};

const CreativeWorkshop = () => {
  const navigate = useNavigate();
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [canvas, setCanvas] = useState(defaultCanvas);
  const [zCounter, setZCounter] = useState(10);

  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedId) || null,
    [elements, selectedId]
  );

  const addElement = (type) => {
    const template = ELEMENT_TEMPLATES[type];
    if (!template) return;

    const newId = `${type}-${Date.now()}`;
    const nextZ = zCounter + 1;
    const element = {
      id: newId,
      type,
      zIndex: nextZ,
      rotation: 0,
      ...template.props
    };

    setElements((prev) => [...prev, element]);
    setSelectedId(newId);
    setZCounter(nextZ);
  };

  const duplicateElement = (id) => {
    const current = elements.find((item) => item.id === id);
    if (!current) return;

    const newId = `${current.type}-${Date.now()}`;
    const nextZ = zCounter + 1;
    const clone = {
      ...current,
      id: newId,
      x: current.x + 32,
      y: current.y + 32,
      zIndex: nextZ
    };

    setElements((prev) => [...prev, clone]);
    setSelectedId(newId);
    setZCounter(nextZ);
  };

  const updateElement = (id, updates) => {
    setElements((prev) =>
      prev.map((element) => (element.id === id ? { ...element, ...updates } : element))
    );
  };

  const deleteElement = (id) => {
    setElements((prev) => prev.filter((element) => element.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const bringToFront = (id) => {
    const nextZ = zCounter + 1;
    updateElement(id, { zIndex: nextZ });
    setZCounter(nextZ);
  };

  const sendToBack = (id) => {
    updateElement(id, { zIndex: 1 });
  };

  const moveElement = (index, direction) => {
    setElements((prev) => {
      const list = [...prev];
      if (direction === 'up' && index > 0) {
        [list[index - 1], list[index]] = [list[index], list[index - 1]];
      }
      if (direction === 'down' && index < list.length - 1) {
        [list[index + 1], list[index]] = [list[index], list[index + 1]];
      }
      return list;
    });
  };

  const parseAvatarMembers = (body = '') => {
    return body
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [namePart, rolePart] = entry.split('–').map((value) => value?.trim() || '');
        return { name: namePart, role: rolePart };
      });
  };

  const stringifyAvatarMembers = (members) =>
    members
      .filter((member) => member.name || member.role)
      .map((member) => (member.role ? `${member.name || 'Integrante'} – ${member.role}` : member.name))
      .join('\n');

  const handleAvatarMemberChange = (id, index, field, value) => {
    setElements((prev) =>
      prev.map((element) => {
        if (element.id !== id) return element;
        const members = parseAvatarMembers(element.body);
        if (!members[index]) {
          members[index] = { name: '', role: '' };
        }
        members[index] = { ...members[index], [field]: value };
        return { ...element, body: stringifyAvatarMembers(members) };
      })
    );
  };

  const handleAvatarAddMember = (id) => {
    setElements((prev) =>
      prev.map((element) => {
        if (element.id !== id) return element;
        const members = parseAvatarMembers(element.body);
        members.push({ name: 'Nuevo integrante', role: 'Rol' });
        return { ...element, body: stringifyAvatarMembers(members) };
      })
    );
  };

  const handleAvatarRemoveMember = (id, index) => {
    setElements((prev) =>
      prev.map((element) => {
        if (element.id !== id) return element;
        const members = parseAvatarMembers(element.body);
        members.splice(index, 1);
        const nextBody = stringifyAvatarMembers(
          members.length ? members : [{ name: 'Integrante', role: 'Rol' }]
        );
        return { ...element, body: nextBody };
      })
    );
  };

  const resetCanvas = () => {
    setElements([]);
    setSelectedId(null);
    setCanvas(defaultCanvas);
    setZCounter(10);
  };

  const handleCanvasPreset = (presetId) => {
    if (presetId === 'custom') {
      setCanvas((prev) => ({ ...prev, presetId }));
      return;
    }

    const preset = CANVAS_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    setCanvas((prev) => ({
      ...prev,
      presetId,
      background: preset.background,
      decoration: preset.decoration
    }));
  };

  const handleCanvasConfigChange = (field, value) => {
    setCanvas((prev) => ({ ...prev, [field]: value }));
  };

  const decorationStyles = () => {
    if (!canvas.showGrid) {
      return { image: '', size: '', repeat: '' };
    }

    if (canvas.decoration === 'grid') {
      return {
        image:
          'linear-gradient(90deg, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(rgba(148,163,184,0.18) 1px, transparent 1px)',
        size: '48px 48px, 48px 48px',
        repeat: 'repeat, repeat'
      };
    }

    if (canvas.decoration === 'stars') {
      return {
        image:
          'radial-gradient(2px 2px at 20px 20px, rgba(148,197,255,0.45), transparent 70%), radial-gradient(1.8px 1.8px at 80px 120px, rgba(14,116,144,0.35), transparent 70%)',
        size: 'auto, auto',
        repeat: 'repeat, repeat'
      };
    }

    if (canvas.decoration === 'particles') {
      return {
        image:
          'radial-gradient(4px 4px at 25px 35px, rgba(250,204,21,0.32), transparent 60%), radial-gradient(3px 3px at 120px 90px, rgba(236,72,153,0.20), transparent 60%)',
        size: 'auto, auto',
        repeat: 'repeat, repeat'
      };
    }

    return { image: '', size: '', repeat: '' };
  };

  const decoration = decorationStyles();
  const backgroundImages = [];
  const backgroundSizes = [];
  const backgroundRepeats = [];
  const backgroundBlendModes = [];

  if (decoration.image) {
    backgroundImages.push(decoration.image);
    backgroundSizes.push(decoration.size || 'auto');
    backgroundRepeats.push(decoration.repeat || 'repeat');
    backgroundBlendModes.push('normal');
  }

  if (canvas.backgroundImage) {
    backgroundImages.push(`url(${canvas.backgroundImage})`);
    backgroundSizes.push('cover');
    backgroundRepeats.push('no-repeat');
    backgroundBlendModes.push('overlay');
  }

  const backgroundImageValue = backgroundImages.length ? backgroundImages.join(', ') : undefined;
  const backgroundSizeValue = backgroundSizes.length ? backgroundSizes.join(', ') : undefined;
  const backgroundRepeatValue = backgroundRepeats.length ? backgroundRepeats.join(', ') : undefined;
  const backgroundBlendModeValue = backgroundBlendModes.length ? backgroundBlendModes.join(', ') : undefined;

  const renderElementInner = (element) => {
    if (element.type === 'button') {
      const link = element.linkUrl && element.linkUrl.trim().length > 0 ? element.linkUrl.trim() : '';
      return (
        <Button
          fullWidth
          component={link ? 'a' : 'button'}
          href={link || undefined}
          target={link ? '_blank' : undefined}
          rel={link ? 'noopener noreferrer' : undefined}
          onClick={(event) => {
            if (!link) return;
            event.preventDefault();
          }}
          sx={{
            height: '100%',
            backgroundColor: element.backgroundColor,
            color: element.textColor,
            borderRadius: element.borderRadius,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: element.fontSize,
            border: `${element.borderWidth}px solid ${element.borderColor}`,
            boxShadow: element.shadow ? '0 15px 35px rgba(34, 197, 94, 0.35)' : 'none'
          }}
        >
          {element.heading || 'Llamada a la acción'}
        </Button>
      );
    }

    if (element.type === 'separator') {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: element.borderRadius,
            background: element.backgroundColor,
            boxShadow: element.shadow ? '0 10px 22px rgba(15,23,42,0.18)' : 'none'
          }}
        />
      );
    }

    if (element.type === 'badge') {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: element.borderRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `${element.borderWidth}px solid ${element.borderColor}`,
            backgroundColor: element.backgroundColor,
            color: element.textColor,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}
        >
          {element.heading || 'Insignia'}
        </Box>
      );
    }

    if (element.type === 'circle') {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: element.backgroundColor,
            boxShadow: element.shadow ? '0 35px 70px rgba(14,116,144,0.25)' : 'none'
          }}
        />
      );
    }

    if (element.type === 'stat') {
      return (
        <Stack
          spacing={1.5}
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: element.borderRadius,
            border: `${element.borderWidth}px solid ${element.borderColor}`,
            background: element.backgroundColor,
            color: element.textColor,
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: element.shadow ? '0 38px 90px rgba(15,23,42,0.35)' : 'none',
            p: 4
          }}
        >
          <Typography variant="h2" sx={{ fontSize: element.fontSize, fontWeight: 800, lineHeight: 1 }}>
            {element.heading || '00%'}
          </Typography>
          {element.body && (
            <Typography variant="body1" sx={{ opacity: 0.92 }}>
              {element.body}
            </Typography>
          )}
          {element.linkUrl && element.linkUrl.trim() && (
            <Chip
              label={element.linkUrl}
              size="small"
              sx={{ mt: 1, bgcolor: 'rgba(59,130,246,0.12)', color: '#1D4ED8' }}
            />
          )}
        </Stack>
      );
    }

    if (element.type === 'video') {
      return (
        <Stack
          spacing={2}
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: element.borderRadius,
            background: element.backgroundColor,
            color: element.textColor,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: element.shadow ? '0 45px 90px rgba(15,23,42,0.45)' : 'none',
            p: 4,
            textAlign: 'center'
          }}
        >
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              border: '4px solid rgba(248,250,252,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(15,23,42,0.35)'
            }}
          >
            <PlayCircleOutline sx={{ fontSize: 56 }} />
          </Box>
          {element.heading && (
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: element.fontSize }}>
              {element.heading}
            </Typography>
          )}
          {element.body && (
            <Typography variant="body1" sx={{ maxWidth: 420, opacity: 0.92 }}>
              {element.body}
            </Typography>
          )}
          {element.linkUrl && element.linkUrl.trim() && (
            <Chip
              label={element.linkUrl}
              size="small"
              sx={{ bgcolor: 'rgba(59,130,246,0.12)', color: '#1D4ED8' }}
            />
          )}
        </Stack>
      );
    }

    if (element.type === 'quote') {
      return (
        <Stack
          spacing={2}
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: element.borderRadius,
            border: `${element.borderWidth}px solid ${element.borderColor}`,
            background: element.backgroundColor,
            color: element.textColor,
            boxShadow: element.shadow ? '0 28px 55px rgba(15,23,42,0.26)' : 'none',
            p: 4,
            justifyContent: 'center'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontStyle: 'italic',
              fontSize: element.fontSize,
              lineHeight: 1.4
            }}
          >
            {element.body || '"Añade una frase que represente tu propuesta."'}
          </Typography>
          {element.heading && (
            <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
              {element.heading}
            </Typography>
          )}
        </Stack>
      );
    }

    if (element.type === 'carousel') {
      const carouselItems = element.body
        ? element.body.split('\n').map((item) => item.trim()).filter(Boolean)
        : [];

      return (
        <Stack
          spacing={2}
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: element.borderRadius,
            border: `${element.borderWidth}px solid ${element.borderColor}`,
            background: element.backgroundColor,
            color: element.textColor,
            boxShadow: element.shadow ? '0 28px 55px rgba(15,23,42,0.2)' : 'none',
            p: 4
          }}
        >
          {element.heading && (
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {element.heading}
            </Typography>
          )}
          <Stack direction="row" spacing={2} sx={{ overflowX: 'auto' }}>
            {carouselItems.map((item, index) => (
              <Card
                key={`${element.id}-carousel-${index}`}
                sx={{
                  minWidth: 180,
                  borderRadius: 3,
                  bgcolor: 'rgba(148,163,184,0.12)',
                  border: 'none',
                  boxShadow: '0 10px 24px rgba(15,23,42,0.08)'
                }}
              >
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Hito {index + 1}
                  </Typography>
                  <Typography variant="body2">{item}</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Stack>
      );
    }

    if (element.type === 'checklist') {
      const checklistItems = element.body
        ? element.body.split('\n').map((item) => item.trim()).filter(Boolean)
        : [];

      return (
        <Stack
          spacing={2.5}
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: element.borderRadius,
            border: `${element.borderWidth}px solid ${element.borderColor}`,
            background: element.backgroundColor,
            color: element.textColor,
            boxShadow: element.shadow ? '0 28px 55px rgba(15,23,42,0.16)' : 'none',
            p: 4
          }}
        >
          {element.heading && (
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {element.heading}
            </Typography>
          )}
          <Stack spacing={1.5}>
            {checklistItems.map((item, index) => (
              <Stack key={`${element.id}-check-${index}`} direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    bgcolor: 'rgba(37,99,235,0.16)',
                    border: '2px solid rgba(37,99,235,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'rgba(37,99,235,0.9)' }}>
                    ✓
                  </Typography>
                </Box>
                <Typography variant="body1">{item}</Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      );
    }

    if (element.type === 'avatarStrip') {
      const avatars = element.body
        ? element.body.split('\n').map((item) => item.trim()).filter(Boolean)
        : [];

      return (
        <Stack
          spacing={2}
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: element.borderRadius,
            border: `${element.borderWidth}px solid ${element.borderColor}`,
            background: element.backgroundColor,
            color: element.textColor,
            boxShadow: element.shadow ? '0 24px 60px rgba(15,23,42,0.18)' : 'none',
            p: 4
          }}
        >
          {element.heading && (
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {element.heading}
            </Typography>
          )}
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {avatars.map((item, index) => {
              const [name, role] = item.split('–').map((part) => part.trim());
              return (
                <Stack
                  key={`${element.id}-avatar-${index}`}
                  spacing={0.5}
                  sx={{ alignItems: 'flex-start', minWidth: 120 }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      bgcolor: `rgba(37,99,235,${0.25 + index * 0.1})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#1E293B'
                    }}
                  >
                    {name?.[0] || '?'}
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {name || item}
                  </Typography>
                  {role && (
                    <Typography variant="caption" sx={{ color: 'rgba(71,85,105,0.85)' }}>
                      {role}
                    </Typography>
                  )}
                </Stack>
              );
            })}
          </Stack>
        </Stack>
      );
    }

    if (element.type === 'palette') {
      return (
        <Stack
          spacing={1.5}
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: element.borderRadius,
            background: element.backgroundColor,
            color: element.textColor,
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: element.shadow ? '0 35px 80px rgba(99,102,241,0.35)' : 'none',
            p: 4
          }}
        >
          {element.heading && (
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: element.fontSize }}>
              {element.heading}
            </Typography>
          )}
          {element.body && (
            <Typography variant="body1" sx={{ maxWidth: 480 }}>
              {element.body}
            </Typography>
          )}
        </Stack>
      );
    }

    if (element.type === 'timeline') {
      const timelineItems = element.body
        ? element.body.split('\n').map((item) => item.trim()).filter(Boolean)
        : [];

      return (
        <Stack
          spacing={2.5}
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: element.borderRadius,
            border: `${element.borderWidth}px solid ${element.borderColor}`,
            background: element.backgroundColor,
            color: element.textColor,
            boxShadow: element.shadow ? '0 24px 60px rgba(15,23,42,0.18)' : 'none',
            p: 4
          }}
        >
          {element.heading && (
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {element.heading}
            </Typography>
          )}
          <Stack spacing={2}>
            {timelineItems.map((item, index) => (
              <Stack key={`${element.id}-timeline-${index}`} direction="row" spacing={2} alignItems="flex-start">
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: 'rgba(37,99,235,0.9)',
                    mt: 0.8
                  }}
                />
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Paso {index + 1}
                  </Typography>
                  <Typography variant="body2">{item}</Typography>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Stack>
      );
    }

    const alignmentProps = (() => {
      if (element.alignment === 'left') return { alignItems: 'flex-start', textAlign: 'left' };
      if (element.alignment === 'right') return { alignItems: 'flex-end', textAlign: 'right' };
      return { alignItems: 'center', textAlign: 'center' };
    })();

    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: element.borderRadius,
          border: `${element.borderWidth}px solid ${element.borderColor}`,
          color: element.textColor,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: element.body ? 1.5 : 0,
          padding: '22px',
          boxSizing: 'border-box',
          background:
            element.type === 'image' && element.imageUrl
              ? `${element.backgroundColor} url(${element.imageUrl}) center/cover no-repeat`
              : element.backgroundColor,
          boxShadow: element.shadow ? '0 28px 55px rgba(15,23,42,0.26)' : 'none',
          ...alignmentProps
        }}
      >
        {element.heading && (
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontSize: element.fontSize,
              lineHeight: 1.08
            }}
          >
            {element.heading}
          </Typography>
        )}
        {element.body && (
          <Typography variant="body2" sx={{ opacity: 0.92 }}>
            {element.body}
          </Typography>
        )}
        {element.linkUrl && element.linkUrl.trim() && (
          <Chip
            label={element.linkUrl}
            size="small"
            sx={{ mt: 1, bgcolor: 'rgba(59,130,246,0.12)', color: '#1D4ED8', alignSelf: 'flex-start' }}
          />
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        bgcolor: '#F4F7FD',
        color: '#0F172A',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        pb: 6
      }}
    >
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          top: 0,
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 18px 40px rgba(15,23,42,0.08)'
        }}
      >
        <Toolbar disableGutters sx={{ py: 2 }}>
          <Container maxWidth="xl">
            <Stack spacing={2.5}>
              <Stack
                direction={{ xs: 'column', lg: 'row' }}
                spacing={{ xs: 2, lg: 3 }}
                alignItems={{ xs: 'flex-start', lg: 'center' }}
                justifyContent="space-between"
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 1, sm: 2 }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate('/')}
                    sx={{ textTransform: 'none', fontWeight: 600, minWidth: 200 }}
                  >
                    Volver a la landing
                  </Button>

                  <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                    <Typography variant="h6" sx={{ color: '#0F172A', fontWeight: 700 }}>
                      Kit de construcción mental
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(71,85,105,0.95)' }}>
                      Diseña como en Canva: combina bloques, colores y enlaces para narrar tu propuesta.
                    </Typography>
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<GridOn fontSize="small" />}
                    onClick={() => handleCanvasConfigChange('showGrid', !canvas.showGrid)}
                    sx={{ textTransform: 'none', borderColor: 'rgba(148,163,184,0.35)' }}
                  >
                    {canvas.showGrid ? 'Ocultar rejilla' : 'Mostrar rejilla'}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={resetCanvas}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Limpiar lienzo
                  </Button>
                </Stack>
              </Stack>

              <Stack
                direction="row"
                spacing={3}
                alignItems="flex-start"
                sx={{ overflowX: 'auto', pb: 1 }}
              >
                {TOOLBAR_SECTIONS.map((section) => (
                  <Stack key={section.label} spacing={1.2} minWidth={220}>
                    <Typography variant="overline" sx={{ color: '#64748B', fontWeight: 700 }}>
                      {section.label}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Tooltip key={item.type} title={item.description} arrow>
                            <Button
                              onClick={() => addElement(item.type)}
                              variant="outlined"
                              color="inherit"
                              size="small"
                              startIcon={<Icon fontSize="small" />}
                              sx={{
                                textTransform: 'none',
                                borderRadius: 16,
                                color: '#0F172A',
                                borderColor: 'rgba(148,163,184,0.35)',
                                bgcolor: '#F8FAFC',
                                boxShadow: '0 6px 16px rgba(15,23,42,0.05)',
                                '&:hover': {
                                  borderColor: '#2563EB',
                                  bgcolor: 'rgba(37,99,235,0.1)',
                                  color: '#1D4ED8'
                                }
                              }}
                            >
                              {item.label}
                            </Button>
                          </Tooltip>
                        );
                      })}
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Container>
        </Toolbar>
      </AppBar>
      <Container maxWidth={false} sx={{ flexGrow: 1, py: 5, px: { xs: 2, md: 4, xl: 8 } }}>
        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} lg={2} xl={2}>
            <Stack spacing={3}>
              <Card
                sx={{
                  bgcolor: '#FFFFFF',
                  borderRadius: 3,
                  border: '1px solid rgba(148,163,184,0.25)',
                  boxShadow: '0 18px 40px rgba(15,23,42,0.08)'
                }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                      Ajustes del lienzo
                    </Typography>
                    <TextField
                      select
                      label="Plantilla"
                      value={canvas.presetId}
                      onChange={(event) => handleCanvasPreset(event.target.value)}
                      fullWidth
                    >
                      {CANVAS_PRESETS.map((preset) => (
                        <MenuItem key={preset.id} value={preset.id}>
                          {preset.label}
                        </MenuItem>
                      ))}
                      <MenuItem value="custom">Personalizado</MenuItem>
                    </TextField>
                    <TextField
                      label="Color / gradiente"
                      value={canvas.background}
                      onChange={(event) => handleCanvasConfigChange('background', event.target.value)}
                      helperText="Acepta hex, rgb o cualquier sintaxis CSS"
                    />
                    <TextField
                      label="Imagen de fondo"
                      value={canvas.backgroundImage}
                      onChange={(event) => handleCanvasConfigChange('backgroundImage', event.target.value)}
                      placeholder="https://..."
                      helperText="Opcional: mezcla la imagen con el color base"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={canvas.showGrid}
                          onChange={(event) => handleCanvasConfigChange('showGrid', event.target.checked)}
                        />
                      }
                      label="Mostrar rejilla pedagógica"
                    />
                  </Stack>
                </CardContent>
              </Card>

              <Card
                sx={{
                  bgcolor: '#FFFFFF',
                  borderRadius: 3,
                  border: '1px solid rgba(148,163,184,0.25)',
                  boxShadow: '0 18px 40px rgba(15,23,42,0.08)'
                }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                      Personaliza el bloque
                    </Typography>
                    {!selectedElement ? (
                      <Typography variant="body2" sx={{ color: 'rgba(71,85,105,0.75)' }}>
                        Selecciona un elemento del lienzo para ajustar texto, colores, alineación y sombra. Piensa en
                        cómo cada cambio comunica un mensaje.
                      </Typography>
                    ) : (
                      <Stack spacing={2}>
                        <TextField
                          label="Título / Texto principal"
                          value={selectedElement.heading}
                          onChange={(event) => updateElement(selectedElement.id, { heading: event.target.value })}
                          fullWidth
                        />
                        {selectedElement.type !== 'button' && selectedElement.type !== 'separator' && (
                          <TextField
                            label="Descripción"
                            value={selectedElement.body}
                            onChange={(event) => updateElement(selectedElement.id, { body: event.target.value })}
                            fullWidth
                            multiline
                            minRows={3}
                          />
                        )}
                        {selectedElement.type === 'image' && (
                          <TextField
                            label="URL de la imagen"
                            value={selectedElement.imageUrl || ''}
                            onChange={(event) => updateElement(selectedElement.id, { imageUrl: event.target.value })}
                            fullWidth
                            placeholder="https://"
                          />
                        )}

                        {selectedElement.type !== 'separator' && (
                          <Stack spacing={1}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                              Tamaño del texto principal
                            </Typography>
                            <ToggleButtonGroup
                              exclusive
                              size="small"
                              value={selectedElement.fontSize}
                              onChange={(_, value) => {
                                if (value !== null) {
                                  updateElement(selectedElement.id, { fontSize: Number(value) });
                                }
                              }}
                            >
                              {FONT_OPTIONS.map((option) => (
                                <ToggleButton key={option.value} value={option.value}>
                                  {option.label}
                                </ToggleButton>
                              ))}
                            </ToggleButtonGroup>
                          </Stack>
                        )}

                        <Stack spacing={1}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                            Bordes y sombras
                          </Typography>
                          <TextField
                            label="Borde (px)"
                            type="number"
                            value={selectedElement.borderWidth}
                            onChange={(event) =>
                              updateElement(selectedElement.id, { borderWidth: Number(event.target.value) || 0 })
                            }
                            fullWidth
                          />
                          <TextField
                            label="Radio (px)"
                            type="number"
                            value={selectedElement.borderRadius}
                            onChange={(event) =>
                              updateElement(selectedElement.id, { borderRadius: Number(event.target.value) || 0 })
                            }
                            fullWidth
                          />
                          <TextField
                            label="Color del borde"
                            type="color"
                            value={selectedElement.borderColor}
                            onChange={(event) => updateElement(selectedElement.id, { borderColor: event.target.value })}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={Boolean(selectedElement.shadow)}
                                onChange={(event) => updateElement(selectedElement.id, { shadow: event.target.checked })}
                              />
                            }
                            label="Activar sombra"
                          />
                        </Stack>

                        <Stack spacing={1}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                            Colores
                          </Typography>
                          <TextField
                            label="Fondo"
                            type="color"
                            value={selectedElement.backgroundColor}
                            onChange={(event) =>
                              updateElement(selectedElement.id, { backgroundColor: event.target.value })
                            }
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                          />
                          {selectedElement.type !== 'separator' && (
                            <TextField
                              label="Texto"
                              type="color"
                              value={selectedElement.textColor}
                              onChange={(event) => updateElement(selectedElement.id, { textColor: event.target.value })}
                              InputLabelProps={{ shrink: true }}
                              fullWidth
                            />
                          )}
                        </Stack>

                        {Object.prototype.hasOwnProperty.call(selectedElement, 'linkUrl') && (
                          <TextField
                            label="Enlace (opcional)"
                            type="url"
                            value={selectedElement.linkUrl || ''}
                            onChange={(event) => updateElement(selectedElement.id, { linkUrl: event.target.value })}
                            placeholder="https://"
                            fullWidth
                            helperText="Permite anticipar hacia dónde llevarías al visitante."
                          />
                        )}

                        {selectedElement.type === 'avatarStrip' && (
                          <Stack spacing={1.5}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                                Integrantes
                              </Typography>
                              <Tooltip title="Añadir integrante" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleAvatarAddMember(selectedElement.id)}
                                  color="primary"
                                >
                                  <Add fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                            <Stack spacing={1}>
                              {parseAvatarMembers(selectedElement.body).map((member, index) => (
                                <Stack key={`${selectedElement.id}-member-${index}`} spacing={0.75}>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <TextField
                                      label="Nombre"
                                      value={member.name}
                                      onChange={(event) =>
                                        handleAvatarMemberChange(selectedElement.id, index, 'name', event.target.value)
                                      }
                                      fullWidth
                                    />
                                    <TextField
                                      label="Rol"
                                      value={member.role}
                                      onChange={(event) =>
                                        handleAvatarMemberChange(selectedElement.id, index, 'role', event.target.value)
                                      }
                                      fullWidth
                                    />
                                    <Tooltip title="Eliminar integrante" arrow>
                                      <span>
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleAvatarRemoveMember(selectedElement.id, index)}
                                          disabled={parseAvatarMembers(selectedElement.body).length === 1}
                                        >
                                          <RemoveCircleOutline fontSize="small" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </Stack>
                                </Stack>
                              ))}
                            </Stack>
                          </Stack>
                        )}

                        {selectedElement.type !== 'button' &&
                          selectedElement.type !== 'separator' &&
                          selectedElement.type !== 'badge' && (
                            <Stack spacing={1}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                                Alineación del contenido
                              </Typography>
                              <ToggleButtonGroup
                                exclusive
                                size="small"
                                value={selectedElement.alignment}
                                onChange={(_, value) => {
                                  if (value !== null) {
                                    updateElement(selectedElement.id, { alignment: value });
                                  }
                                }}
                              >
                                {ALIGNMENT_OPTIONS.map((option) => (
                                  <ToggleButton key={option.value} value={option.value}>
                                    {option.label}
                                  </ToggleButton>
                                ))}
                              </ToggleButtonGroup>
                            </Stack>
                          )}

                        {selectedElement.type !== 'button' &&
                          selectedElement.type !== 'separator' &&
                          selectedElement.type !== 'badge' && (
                            <Stack spacing={1}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                                Altura del bloque
                              </Typography>
                              <ToggleButtonGroup
                                exclusive
                                size="small"
                                value={selectedElement.height}
                                onChange={(_, value) => {
                                  if (value !== null) {
                                    updateElement(selectedElement.id, { height: Number(value) });
                                  }
                                }}
                              >
                                {HEIGHT_OPTIONS.map((option) => (
                                  <ToggleButton key={option.value} value={option.value}>
                                    {option.label}
                                  </ToggleButton>
                                ))}
                              </ToggleButtonGroup>
                            </Stack>
                          )}

                        <Stack spacing={1}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                            Rotación
                          </Typography>
                          <Slider
                            min={-25}
                            max={25}
                            value={selectedElement.rotation || 0}
                            onChange={(_, value) =>
                              updateElement(selectedElement.id, {
                                rotation: Array.isArray(value) ? value[0] : value
                              })
                            }
                            marks={[{ value: 0, label: '0°' }]}
                          />
                        </Stack>
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          <Grid item xs={12} lg={8} xl={8}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 4,
                border: '1px solid rgba(148,163,184,0.35)',
                bgcolor: '#FFFFFF',
                boxShadow: '0 24px 60px rgba(15,23,42,0.1)'
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 4 }, height: '100%', overflowX: 'auto' }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: `${canvas.width}px`,
                    minHeight: canvas.height,
                    borderRadius: 4,
                    mx: 'auto',
                    overflow: 'visible',
                    p: { xs: 4, md: 6 },
                    backgroundColor: canvas.background,
                    backgroundImage: backgroundImageValue,
                    backgroundSize: backgroundSizeValue,
                    backgroundRepeat: backgroundRepeatValue || 'no-repeat',
                    backgroundBlendMode: backgroundBlendModeValue || 'normal',
                    backgroundPosition: 'center',
                    boxShadow: '0 45px 80px rgba(15,23,42,0.12)',
                    transition: 'background 0.3s ease'
                  }}
                  onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                      setSelectedId(null);
                    }
                  }}
                >
                  {elements.map((element) => (
                    <Rnd
                      key={element.id}
                      size={{ width: element.width, height: element.height }}
                      position={{ x: element.x, y: element.y }}
                      onDragStop={(event, data) => {
                        updateElement(element.id, { x: data.x, y: data.y });
                      }}
                      onResizeStop={(event, direction, ref, delta, position) => {
                        updateElement(element.id, {
                          width: parseFloat(ref.style.width),
                          height: parseFloat(ref.style.height),
                          x: position.x,
                          y: position.y
                        });
                      }}
                      style={{
                        zIndex: element.zIndex,
                        transform: `rotate(${element.rotation || 0}deg)`
                      }}
                      minWidth={80}
                      minHeight={60}
                      enableResizing
                      onMouseDown={() => setSelectedId(element.id)}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          cursor: 'move',
                          userSelect: 'none',
                          outline: selectedId === element.id ? '3px dashed rgba(96,165,250,0.85)' : 'none',
                          outlineOffset: selectedId === element.id ? '8px' : '0',
                          position: 'relative'
                        }}
                      >
                        {selectedId === element.id && (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{
                              position: 'absolute',
                              top: element.y <= 64 ? 'auto' : -56,
                              bottom: element.y <= 64 ? -56 : 'auto',
                              right: 0,
                              bgcolor: '#FFFFFF',
                              borderRadius: 999,
                              boxShadow: '0 14px 28px rgba(15,23,42,0.15)',
                              border: '1px solid rgba(148,163,184,0.28)',
                              p: 0.5
                            }}
                          >
                            <Tooltip title="Duplicar" arrow>
                              <IconButton
                                size="small"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  duplicateElement(element.id);
                                }}
                              >
                                <ContentCopy fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Traer al frente" arrow>
                              <IconButton
                                size="small"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  bringToFront(element.id);
                                }}
                              >
                                <FlipToFront fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Enviar al fondo" arrow>
                              <IconButton
                                size="small"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  sendToBack(element.id);
                                }}
                              >
                                <FlipToBack fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar" arrow>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deleteElement(element.id);
                                }}
                              >
                                <Delete fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        )}
                        {renderElementInner(element)}
                      </Box>
                    </Rnd>
                  ))}

                  {elements.length === 0 && (
                    <Stack
                      spacing={1.5}
                      alignItems="center"
                      justifyContent="center"
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        color: 'rgba(15,23,42,0.65)',
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        El lienzo está listo
                      </Typography>
                      <Typography variant="body2" sx={{ maxWidth: 360, color: 'rgba(71,85,105,0.85)' }}>
                        Usa la barra superior para añadir títulos, imágenes, botones o separadores. Todo comunica una
                        historia.
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={2} xl={2}>
            <Stack spacing={3}>
              <Card
                sx={{
                  bgcolor: '#FFFFFF',
                  borderRadius: 3,
                  border: '1px solid rgba(148,163,184,0.25)',
                  boxShadow: '0 18px 40px rgba(15,23,42,0.08)'
                }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                      Capas del proyecto
                    </Typography>
                    {elements.length === 0 ? (
                      <Typography variant="body2" sx={{ color: 'rgba(71,85,105,0.75)' }}>
                        Los elementos que agregues aparecerán aquí. Úsalos para elegir capas, duplicar o explicar la
                        función de cada uno.
                      </Typography>
                    ) : (
                      <Stack spacing={1.5}>
                        {elements.map((element, index) => (
                          <Card
                            key={element.id}
                            variant="outlined"
                            onClick={() => setSelectedId(element.id)}
                            sx={{
                              borderRadius: 2,
                              borderColor:
                                selectedId === element.id ? 'rgba(79,70,229,0.65)' : 'rgba(148,163,184,0.25)',
                              cursor: 'pointer',
                              bgcolor: selectedId === element.id ? 'rgba(37,99,235,0.08)' : '#FFFFFF',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                borderColor: 'rgba(79,70,229,0.45)'
                              }
                            }}
                          >
                            <CardContent sx={{ py: 1.2, '&:last-child': { pb: 1.2 } }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  size="small"
                                  label={`${index + 1}. ${ELEMENT_TEMPLATES[element.type]?.label || element.type}`}
                                  sx={{ fontWeight: 600, bgcolor: 'rgba(59,130,246,0.12)', color: '#1D4ED8' }}
                                />
                                <Stack direction="row" spacing={0.5} ml="auto">
                                  <Tooltip title="Duplicar">
                                    <IconButton
                                      size="small"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        duplicateElement(element.id);
                                      }}
                                    >
                                      <ContentCopy fontSize="inherit" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Al frente">
                                    <IconButton
                                      size="small"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        bringToFront(element.id);
                                      }}
                                    >
                                      <FlipToFront fontSize="inherit" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Al fondo">
                                    <IconButton
                                      size="small"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        sendToBack(element.id);
                                      }}
                                    >
                                      <FlipToBack fontSize="inherit" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Subir orden">
                                    <span>
                                      <IconButton
                                        size="small"
                                        disabled={index === 0}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          moveElement(index, 'up');
                                        }}
                                      >
                                        <ArrowUpward fontSize="inherit" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title="Bajar orden">
                                    <span>
                                      <IconButton
                                        size="small"
                                        disabled={index === elements.length - 1}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          moveElement(index, 'down');
                                        }}
                                      >
                                        <ArrowDownward fontSize="inherit" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title="Eliminar">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        deleteElement(element.id);
                                      }}
                                    >
                                      <Delete fontSize="inherit" />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <Card
                sx={{
                  bgcolor: '#FFFFFF',
                  borderRadius: 3,
                  border: '1px solid rgba(148,163,184,0.25)',
                  boxShadow: '0 18px 40px rgba(15,23,42,0.08)'
                }}
              >
                <CardContent>
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                      Desafío de mentalidad
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2" sx={{ color: 'rgba(71,85,105,0.85)' }}>
                        • Cada bloque debe tener un propósito: informa, persuade o invita.
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(71,85,105,0.85)' }}>
                        • Describe con claridad qué hace cada elemento y por qué lo ubicaste allí.
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(71,85,105,0.85)' }}>
                        • Experimenta con contrastes para demostrar cómo manejarías la identidad visual de la
                        institución.
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default CreativeWorkshop;
