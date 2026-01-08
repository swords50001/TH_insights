-- Migration: Add container customization fields for group headers
-- Adds header_bg_color and header_text_color for customizable group headers

ALTER TABLE dashboard_cards 
ADD COLUMN header_bg_color VARCHAR(50) DEFAULT 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

ALTER TABLE dashboard_cards 
ADD COLUMN header_text_color VARCHAR(50) DEFAULT '#ffffff';
