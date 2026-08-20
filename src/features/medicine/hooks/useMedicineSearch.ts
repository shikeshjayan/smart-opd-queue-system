import { useEffect, useState } from "react";
import { useAsync } from "@/lib/use-async";
import { medicineService } from "@/services/medicine";

export function useMedicineSearch() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(id);
  }, [query]);

  const search = useAsync(() => medicineService.search(debounced), [debounced]);

  return { query, setQuery, ...search };
}