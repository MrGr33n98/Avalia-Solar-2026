import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';

const Header = () => (
  <div className="flex items-center">
    <Link href="/" className="flex items-center">
      <BrandLogo className="h-10" sizes="174px" />
    </Link>
  </div>
);

export default Header;
