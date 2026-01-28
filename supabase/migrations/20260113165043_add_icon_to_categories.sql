/*
  # Add Icon Field to Categories Table

  This migration adds an icon field to the categories table to store icon names for visual representation.

  ## Changes Made

  1. **Categories Table**
     - Add `icon` column (text) to store the icon name
     - Default value is empty string
     - Icon names can be used with icon libraries like Lucide React

  ## Notes
  - The icon field will store icon names as strings (e.g., 'Pizza', 'Coffee', 'Salad')
  - Frontend can use these names to render appropriate icons
*/

-- Add icon column to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '';