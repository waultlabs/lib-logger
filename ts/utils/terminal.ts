/**
 * Check if the terminal supports ANSI colors.
 *
 * @returns true if the terminal supports colors, false otherwise
 */
const hasColors = () => {
  return (
    process.stdout.isTTY &&
    process.stdout.hasColors() &&
    process.env.TERM !== 'dumb' &&
    !process.env.NO_COLOR
  );
};

export { hasColors };
