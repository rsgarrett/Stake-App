"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Search, BookOpen } from "lucide-react"
import { englishMenuTitleCase } from "@/lib/utils/english-menu-title-case"

interface HandbookSection {
  id: string
  section_number: string
  title: string
  content: string
  category: string
  created_at: string
}

export default function HandbookPage() {
  const [sections, setSections] = useState<HandbookSection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedSection, setSelectedSection] = useState<HandbookSection | null>(null)
  const supabase = createClient()

  useEffect(() => { loadSections() }, [])

  const loadSections = async () => {
    try {
      const { data } = await supabase.from("handbook_sections").select("*").order("section_number")
      setSections(data || [])
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const categories = Array.from(new Set(sections.map((s) => s.category))).sort()
  const filtered = sections.filter((s) => {
    const matchSearch = !searchTerm || s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.content.toLowerCase().includes(searchTerm.toLowerCase()) || s.section_number.includes(searchTerm)
    const matchCategory = categoryFilter === "all" || s.category === categoryFilter
    return matchSearch && matchCategory
  })

  if (loading) return <div className="p-4 sm:p-6"><div className="text-center py-12">Loading...</div></div>

  return (
    <div className="p-4 sm:p-6">
      <Link href="/modules/training" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Training
      </Link>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">General Handbook Reference</h1>
        <p className="mt-2 text-gray-600">Quick reference to handbook sections and policies</p>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search sections..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">{englishMenuTitleCase("All categories")}</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {englishMenuTitleCase(c)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section list */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Sections ({filtered.length})</CardTitle></CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <p className="text-center text-gray-500 py-4">{sections.length === 0 ? "No handbook sections loaded. Add sections to the handbook_sections table." : "No matches found"}</p>
              ) : (
                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                  {filtered.map((s) => (
                    <button key={s.id} onClick={() => setSelectedSection(s)}
                      className={`w-full text-left p-2 rounded-lg ${selectedSection?.id === s.id ? "bg-indigo-50 border-indigo-200 border" : "hover:bg-gray-50"}`}>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <div>
                          <span className="text-xs text-gray-400">{s.section_number}</span>
                          <div className="text-sm font-medium text-gray-900">{s.title}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section content */}
        <div className="lg:col-span-2">
          {selectedSection ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedSection.section_number} - {selectedSection.title}</CardTitle>
                <CardDescription className="capitalize">{selectedSection.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-gray-800 whitespace-pre-wrap">{selectedSection.content}</div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                Select a section to view its content
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
