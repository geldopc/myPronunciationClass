### Directories
  1. directories in snakeCase
  2. directories should be in the folder `src`
  3. directories should be in the folder `components` if they are components
  4. directories should be in the folder `pages` if they are pages
  5. directories should be in the folder `styles` if they are styles
  6. directories should bg in the folder `hooks`is they are hooks
  7. directories should bg in the folder `utils`is they are utils
  8. directories should be in the folder `providers` if they are providers
  9. directories should be in the folder `routes` if they are routes
  10. Do not create folders with redundant names; if the directory already has a name, it does not need to be repeated. Ex: ThemeProvider can be only providers/Theme
### Components
  1. Directories in CamelCase, with only index.tsx file
  2. If the Component hava a sub-componente he follows the same rule of the step 1
  3. The component should be a function component (never arrow functions), with the name of the file
  4. The component should be in the folder `components`
  5. The component always should be exported as `export` — never `export default`
  6. Sub-components do not need to repeat the parent prefix in their name
  7. Add an `id` attribute to every component to make them easy to locate and test
  8. Always use shadcn components when available
  9. Always implement components responsively
  10. Using a component composition patters
    - Reference: https://vercel.com/academy/nextjs-foundations/component-composition-patterns
  11. Using a atomic design pattern
    - Reference: https://bradfrost.com/blog/post/atomic-web-design/ 
    * Create the directories:
      - elements - atoms
      - widgets - molecules
      - modules - organisms
      - templates - layouts
      - pages  
  12. Shadcn components after downloaded should follow these rules
  13. Don't create several components in the same file, separate them in sub-components
  14. Do not create folders with redundant names; if the directory already has a name, it does not need to be repeated.
### Imports
  1. Always use the `@/` alias for TypeScript imports — never relative paths
### Styling
  1. Do not use arbitrary Tailwind values (e.g. `w-[123px]`)
  2. Do not change the colors defined in `index.css` — the design is minimal black and white
### Phosphor Icons
  1. Should be imported with the sufix `Icon`
  2. Should be imported from the `@phosphor-icons/react` package
### Code Comments
  1. Do not comment out code; code with too many comments is unreadable. Comments will only be accepted in cases of extreme complexity.
### References
  - Minimalism: https://yeezy.com/
  - Top menu: https://kiro.dev and https://workspace.google.com/experiments/?hl=en
  - Animations: https://www.reactbits.dev/
  - shadcn components: https://ui.shadcn.com/docs/components
  - Composition components pattern: https://www.youtube.com/watch?v=WOfrULDNbZ0