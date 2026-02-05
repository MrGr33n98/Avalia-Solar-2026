import Link from 'next/link';
import Image from 'next/image';

const Header = () => (
  <div className="flex items-center">
    <Link href="/" className="flex items-center">
      <Image
        src="/images/logo.png"
        alt="Logo"
        width={75}
        height={50}
        sizes="75px"
        className="h-10 w-[75px] object-contain"
      />
    </Link>
  </div>
);

export default Header;
