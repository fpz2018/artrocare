import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Pill, 
  Plus, 
  Check, 
  Clock, 
  TrendingDown,
  AlertCircle,
  Calendar
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const translations = {
  nl: {
    title: "Medicatie Tracker",
    subtitle: "Houd je medicatie bij en zie het effect op je pijn",
    myMedications: "Mijn Medicijnen",
    addMedication: "Medicijn Toevoegen",
    logIntake: "Inname Registreren",
    todayIntake: "Vandaag",
    history: "Geschiedenis",
    name: "Naam medicijn",
    dosage: "Dosering",
    frequency: "Frequentie",
    type: "Type",
    nsaid: "NSAID (bijv. Ibuprofen)",
    paracetamol: "Paracetamol",
    supplement: "Supplement",
    other: "Overig",
    twiceDaily: "2x per dag",
    threeTimesDaily: "3x per dag",
    onceDaily: "1x per dag",
    asNeeded: "Indien nodig",
    taken: "Ingenomen",
    notTaken: "Niet ingenomen",
    save: "Opslaan",
    cancel: "Annuleren",
    painEffect: "Effect op pijn",
    noMedications: "Je hebt nog geen medicijnen toegevoegd",
    effectiveness: "Effectiviteit analyse",
    avgPainReduction: "Gem. pijnvermindering"
  },
  en: {
    title: "Medication Tracker",
    subtitle: "Track your medication and see its effect on pain",
    myMedications: "My Medications",
    addMedication: "Add Medication",
    logIntake: "Log Intake",
    todayIntake: "Today",
    history: "History",
    name: "Medication name",
    dosage: "Dosage",
    frequency: "Frequency",
    type: "Type",
    nsaid: "NSAID (e.g. Ibuprofen)",
    paracetamol: "Paracetamol",
    supplement: "Supplement",
    other: "Other",
    twiceDaily: "Twice daily",
    threeTimesDaily: "Three times daily",
    onceDaily: "Once daily",
    asNeeded: "As needed",
    taken: "Taken",
    notTaken: "Not taken",
    save: "Save",
    cancel: "Cancel",
    painEffect: "Effect on pain",
    noMedications: "You haven't added any medications yet",
    effectiveness: "Effectiveness analysis",
    avgPainReduction: "Avg pain reduction"
  }
};

export default function Medication() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    frequency: "twice_daily",
    type: "nsaid"
  });
  
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      if (!userData) {
        window.location.href = '/Home';
        return null;
      }
      return userData;
    }
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['medications', user?.email],
    queryFn: () => base44.entities.Medication.filter({ 
      created_by: user.email,
      isActive: true 
    }),
    enabled: !!user
  });

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['medicationLogs', user?.email, new Date().toISOString().split('T')[0]],
    queryFn: () => base44.entities.MedicationLog.filter({ 
      created_by: user.email,
      date: new Date().toISOString().split('T')[0]
    }),
    enabled: !!user
  });

  const addMedicationMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Medication.create({
        ...data,
        isActive: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setShowAddDialog(false);
      setNewMedication({ name: "", dosage: "", frequency: "twice_daily", type: "nsaid" });
    }
  });

  const logIntakeMutation = useMutation({
    mutationFn: async ({ medicationId, taken }) => {
      return base44.entities.MedicationLog.create({
        medicationId,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        taken
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicationLogs'] });
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const lang = user?.language || "nl";
  const t = translations[lang];

  const isTakenToday = (medicationId) => {
    return todayLogs.some(log => log.medicationId === medicationId && log.taken);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Pill className="w-8 h-8 text-purple-600" />
            {t.title}
          </h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Quick Log Today */}
        <Card className="mb-8 shadow-lg border-purple-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                {t.todayIntake}
              </CardTitle>
              <Button onClick={() => setShowAddDialog(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                {t.addMedication}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {medications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Pill className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>{t.noMedications}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {medications.map(med => {
                  const taken = isTakenToday(med.id);
                  return (
                    <div 
                      key={med.id}
                      className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                        taken ? "bg-green-50 border-green-300" : "bg-white border-gray-200"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{med.name}</p>
                        <p className="text-sm text-gray-600">{med.dosage} - {t[med.frequency] || med.frequency}</p>
                      </div>
                      <Button
                        onClick={() => logIntakeMutation.mutate({ medicationId: med.id, taken: !taken })}
                        variant={taken ? "default" : "outline"}
                        className={taken ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {taken ? t.taken : t.logIntake}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Medication Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.addMedication}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t.name}</Label>
                <Input
                  value={newMedication.name}
                  onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                  placeholder="Ibuprofen"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t.dosage}</Label>
                <Input
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                  placeholder="400mg"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t.frequency}</Label>
                <select
                  value={newMedication.frequency}
                  onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                  className="mt-2 w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="once_daily">{t.onceDaily}</option>
                  <option value="twice_daily">{t.twiceDaily}</option>
                  <option value="three_times_daily">{t.threeTimesDaily}</option>
                  <option value="as_needed">{t.asNeeded}</option>
                </select>
              </div>
              <div>
                <Label>{t.type}</Label>
                <select
                  value={newMedication.type}
                  onChange={(e) => setNewMedication({ ...newMedication, type: e.target.value })}
                  className="mt-2 w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="nsaid">{t.nsaid}</option>
                  <option value="paracetamol">{t.paracetamol}</option>
                  <option value="supplement">{t.supplement}</option>
                  <option value="other">{t.other}</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => addMedicationMutation.mutate(newMedication)}
                  disabled={!newMedication.name || addMedicationMutation.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {t.save}
                </Button>
                <Button
                  onClick={() => setShowAddDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  {t.cancel}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}