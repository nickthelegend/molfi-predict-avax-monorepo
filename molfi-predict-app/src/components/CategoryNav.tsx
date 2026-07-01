import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "react-router-dom";

const categories = [
  { name: "All", value: "all" },
  { name: "Molfi", value: "MOLFI_NATIVE" },
  { name: "For You", value: "for_you" },
  { name: "Politics", value: "politics" },
  { name: "Sports", value: "sports" },
  { name: "Crypto", value: "crypto" },
  { name: "Elections", value: "elections" },
  { name: "Economics", value: "economics" },
  { name: "Pop Culture", value: "pop_culture" },
  { name: "Business", value: "business" },
  { name: "Science", value: "science" },
];

const CategoryNav = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';
  const currentVenue = searchParams.get('venue') || 'all';

  const handleCategoryClick = (categoryValue: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (categoryValue === 'MOLFI_NATIVE') {
      params.set('venue', 'MOLFI_NATIVE');
      params.delete('category');
    } else if (categoryValue === 'all') {
      params.delete('category');
      params.delete('venue');
    } else {
      params.set('category', categoryValue);
      params.delete('venue');
    }
    
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="border-b border-border bg-background">
      <div className="px-4">
        <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
          <Badge variant="outline" className="mr-2 text-xs border-destructive/30 text-destructive uppercase tracking-wide">Live</Badge>
          {categories.map((category) => {
            const isActive = category.value === 'MOLFI_NATIVE' 
              ? currentVenue === 'MOLFI_NATIVE'
              : category.value === 'all' 
                ? currentCategory === 'all' && currentVenue === 'all'
                : currentCategory === category.value;

            return (
              <Button
                key={category.name}
                variant="ghost"
                className={`whitespace-nowrap text-xs uppercase tracking-wide transition-colors duration-150 ${
                  isActive 
                    ? 'text-warning bg-warning/10' 
                    : 'text-muted-foreground hover:text-warning hover:bg-transparent'
                }`}
                size="sm"
                onClick={() => handleCategoryClick(category.value)}
              >
                {category.name}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryNav;
