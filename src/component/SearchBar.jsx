import React from 'react'
import { Search } from 'lucide-react';

const SearchBar = () => {
    return (
        <div className='justify-between items-center gap-2 hidden sm:flex'>
            <input type="search" placeholder='search here' className='p-[5.5px] placeholder:text-[16px]' />
            <button>
                <Search />
            </button>
        </div>
    )
}

export default SearchBar;