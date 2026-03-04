-- Add element_layout column for visual drag-and-drop positioning
ALTER TABLE public.certificate_config
ADD COLUMN IF NOT EXISTS element_layout jsonb DEFAULT '{
  "header": { "x": 30, "y": 24, "w": 680, "h": 50, "visible": true, "fontSize": 13, "align": "left" },
  "title": { "x": 0, "y": 90, "w": 842, "h": 50, "visible": true, "fontSize": 30, "align": "center" },
  "recipient": { "x": 60, "y": 170, "w": 722, "h": 60, "visible": true, "fontSize": 26, "align": "center" },
  "body": { "x": 60, "y": 250, "w": 722, "h": 70, "visible": true, "fontSize": 10, "align": "center" },
  "signature": { "x": 30, "y": 380, "w": 160, "h": 80, "visible": true, "fontSize": 9, "align": "center" },
  "qr": { "x": 700, "y": 370, "w": 80, "h": 90, "visible": true, "fontSize": 6, "align": "center" },
  "folio": { "x": 580, "y": 24, "w": 220, "h": 30, "visible": true, "fontSize": 7.5, "align": "right" }
}'::jsonb;
