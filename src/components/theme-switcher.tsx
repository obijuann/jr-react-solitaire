import '../components/theme-switcher.css';
import { themeKeys } from '../themes';

type Props = {
  value: string;
  onChange: (key: string) => void;
};

export default function ThemeSwitcher({ value, onChange }: Props) {
  return (
    <div className="dev-theme-switcher" role="toolbar" aria-label="Theme switcher">
      <label className="dev-theme-label">Theme</label>
      <select
        className="dev-theme-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select theme"
      >
        {themeKeys.map((k) => (
          <option key={String(k)} value={String(k)}>
            {String(k)}
          </option>
        ))}
      </select>
    </div>
  );
}
