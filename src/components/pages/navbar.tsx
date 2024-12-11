function Navbar() {
    return (
      <nav className="w-full bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <a href="/" className="text-3xl font-semibold text-blue-600">Finbot</a>
          <ul className="flex space-x-8">
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer transition">Contact</li>
          </ul>
        </div>
      </nav>
    );
  }

export default Navbar;