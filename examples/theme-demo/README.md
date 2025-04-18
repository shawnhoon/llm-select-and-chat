# SelectChat Theme Demo

This demo showcases how to customize the appearance of the SelectChat component using the theme utilities provided in the SelectChat library.

## Features

- **Live Theme Customization**: Modify theme properties and see changes in real-time
- **Theme Code Generation**: Get the code needed to implement your custom theme
- **Multiple Base Themes**: Choose from light, dark, blue, and green base themes
- **Typography Controls**: Adjust font sizes to match your application
- **Spacing Options**: Control the density of UI elements
- **Border Radius Settings**: Customize the roundness of UI components
- **Color Customization**: Change the primary color to match your brand

## How to Run

1. Make sure you have built the SelectChat library:
   ```
   npm run build
   ```

2. Open the `index.html` file in your browser:
   ```
   open examples/theme-demo/index.html
   ```

3. Experiment with different theme options using the control panel on the left side.

4. Press the "Apply Theme" button to see your changes in the SelectChat component.

5. Copy the generated theme code from the code display box to use in your own application.

## Integration in Your Project

To use the theme utilities in your project:

1. Copy the `chatThemer.js` file from the `examples/react` directory to your project.

2. Import the theme utilities:
   ```js
   import { createCustomTheme, themePresets } from './chatThemer';
   ```

3. Create a custom theme object:
   ```js
   const customTheme = createCustomTheme('light', {
     fontSizes: 'medium',
     spacing: 'medium', 
     borderRadius: 'medium',
     colors: {
       primary: '#1a73e8',
       accent: '#1a73e8'
     }
   });
   ```

4. Pass the theme to the SelectChat component:
   ```js
   <SelectChat theme={customTheme} />
   ```

## Advanced Usage

The theme utilities support more advanced customizations, including:

- Responsive theme adjustment based on system preferences
- Deep merging of theme objects for partial overrides
- Pre-defined presets for quick implementation

See the `chatThemer.js` file for complete documentation of available options. 