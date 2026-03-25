import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

// HOOS-12 Vragen
const HOOS12_QUESTIONS = [
  // Pijn (5 vragen)
  {
    id: 'p1',
    category: 'pain',
    text: 'Hoe vaak heb je pijn in je heup?',
    options: [
      { value: 4, label: 'Nooit' },
      { value: 3, label: 'Elke maand' },
      { value: 2, label: 'Elke week' },
      { value: 1, label: 'Dagelijks' },
      { value: 0, label: 'Altijd' }
    ]
  },
  {
    id: 'p2',
    category: 'pain',
    text: 'In welke mate heb je pijn in je heup bij het lopen op een vlakke ondergrond?',
    options: [
      { value: 4, label: 'Geen' },
      { value: 3, label: 'Licht' },
      { value: 2, label: 'Matig' },
      { value: 1, label: 'Ernstig' },
      { value: 0, label: 'Extreem' }
    ]
  },
  {
    id: 'p3',
    category: 'pain',
    text: 'In welke mate heb je pijn in je heup bij het traplopen?',
    options: [
      { value: 4, label: 'Geen' },
      { value: 3, label: 'Licht' },
      { value: 2, label: 'Matig' },
      { value: 1, label: 'Ernstig' },
      { value: 0, label: 'Extreem' }
    ]
  },
  {
    id: 'p4',
    category: 'pain',
    text: 'In welke mate heb je pijn in je heup bij het liggen \'s nachts?',
    options: [
      { value: 4, label: 'Geen' },
      { value: 3, label: 'Licht' },
      { value: 2, label: 'Matig' },
      { value: 1, label: 'Ernstig' },
      { value: 0, label: 'Extreem' }
    ]
  },
  {
    id: 'p5',
    category: 'pain',
    text: 'In welke mate heb je pijn in je heup bij het zitten of liggen?',
    options: [
      { value: 4, label: 'Geen' },
      { value: 3, label: 'Licht' },
      { value: 2, label: 'Matig' },
      { value: 1, label: 'Ernstig' },
      { value: 0, label: 'Extreem' }
    ]
  },
  // Functie dagelijkse leven (4 vragen)
  {
    id: 'f1',
    category: 'function_daily',
    text: 'Lopen op een vlakke ondergrond',
    options: [
      { value: 4, label: 'Geen beperking' },
      { value: 3, label: 'Lichte beperking' },
      { value: 2, label: 'Matige beperking' },
      { value: 1, label: 'Ernstige beperking' },
      { value: 0, label: 'Extreme beperking' }
    ]
  },
  {
    id: 'f2',
    category: 'function_daily',
    text: 'Traplopen',
    options: [
      { value: 4, label: 'Geen beperking' },
      { value: 3, label: 'Lichte beperking' },
      { value: 2, label: 'Matige beperking' },
      { value: 1, label: 'Ernstige beperking' },
      { value: 0, label: 'Extreme beperking' }
    ]
  },
  {
    id: 'f3',
    category: 'function_daily',
    text: 'Opstaan vanuit zittende houding',
    options: [
      { value: 4, label: 'Geen beperking' },
      { value: 3, label: 'Lichte beperking' },
      { value: 2, label: 'Matige beperking' },
      { value: 1, label: 'Ernstige beperking' },
      { value: 0, label: 'Extreme beperking' }
    ]
  },
  {
    id: 'f4',
    category: 'function_daily',
    text: 'Hurken/bukken',
    options: [
      { value: 4, label: 'Geen beperking' },
      { value: 3, label: 'Lichte beperking' },
      { value: 2, label: 'Matige beperking' },
      { value: 1, label: 'Ernstige beperking' },
      { value: 0, label: 'Extreme beperking' }
    ]
  },
  // Functie sport/recreatie (2 vragen)
  {
    id: 's1',
    category: 'function_sports',
    text: 'Sportieve activiteiten (wandelen, fietsen, etc.)',
    options: [
      { value: 4, label: 'Geen beperking' },
      { value: 3, label: 'Lichte beperking' },
      { value: 2, label: 'Matige beperking' },
      { value: 1, label: 'Ernstige beperking' },
      { value: 0, label: 'Extreme beperking' }
    ]
  },
  {
    id: 's2',
    category: 'function_sports',
    text: 'Recreatieve activiteiten (tuinieren, etc.)',
    options: [
      { value: 4, label: 'Geen beperking' },
      { value: 3, label: 'Lichte beperking' },
      { value: 2, label: 'Matige beperking' },
      { value: 1, label: 'Ernstige beperking' },
      { value: 0, label: 'Extreme beperking' }
    ]
  },
  // Kwaliteit van leven (1 vraag)
  {
    id: 'q1',
    category: 'quality_of_life',
    text: 'In welke mate beperkt je heup je kwaliteit van leven?',
    options: [
      { value: 4, label: 'Geen' },
      { value: 3, label: 'Licht' },
      { value: 2, label: 'Matig' },
      { value: 1, label: 'Ernstig' },
      { value: 0, label: 'Extreem' }
    ]
  }
];

export default function HOOS12() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    if (profile && !profile.affected_joints?.includes('hip')) {
      toast.info('De HOOS-12 is specifiek voor heupartrose');
    }
  }, [profile]);

  const handleAnswer = (value) => {
    setAnswers({ ...answers, [HOOS12_QUESTIONS[currentQuestion].id]: parseInt(value) });
  };

  const calculateScore = () => {
    const categories = {
      pain: ['p1', 'p2', 'p3', 'p4', 'p5'],
      symptoms: ['p1'],
      function_daily: ['f1', 'f2', 'f3', 'f4'],
      function_sports: ['s1', 's2'],
      quality_of_life: ['q1']
    };

    let totalPoints = 0;
    const scores = {};

    Object.keys(categories).forEach(cat => {
      const questionIds = categories[cat];
      let catSum = 0;
      let catCount = 0;
      
      questionIds.forEach(id => {
        if (answers[id] !== undefined) {
          catSum += answers[id];
          catCount++;
        }
      });
      
      scores[cat] = catCount > 0 ? (catSum / (catCount * 4)) * 100 : 0;
    });

    const allAnswers = Object.values(answers);
    const totalSum = allAnswers.reduce((a, b) => a + b, 0);
    const totalMax = HOOS12_QUESTIONS.length * 4;
    const totalScore = (totalSum / totalMax) * 100;

    let severity = 'minimal';
    if (totalScore < 40) severity = 'severe';
    else if (totalScore < 60) severity = 'moderate';
    else if (totalScore < 80) severity = 'mild';

    return {
      pain_score: Math.round(scores.pain),
      symptoms_score: Math.round(scores.pain),
      function_daily_score: Math.round(scores.function_daily),
      function_sports_score: Math.round(scores.function_sports),
      quality_of_life_score: Math.round(scores.quality_of_life),
      total_score: Math.round(totalScore),
      severity,
      answers
    };
  };

  const handleNext = () => {
    if (currentQuestion < HOOS12_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const finishAssessment = async () => {
    if (Object.keys(answers).length < HOOS12_QUESTIONS.length) {
      toast.error('Beantwoord alle vragen alstublieft');
      return;
    }

    setLoading(true);
    const calculatedScore = calculateScore();
    setScore(calculatedScore);

    try {
      const { error } = await supabase.from('hoos12_scores').insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        pain_score: calculatedScore.pain_score,
        symptoms_score: calculatedScore.symptoms_score,
        function_daily_score: calculatedScore.function_daily_score,
        function_sports_score: calculatedScore.function_sports_score,
        quality_of_life_score: calculatedScore.quality_of_life_score,
        total_score: calculatedScore.total_score,
        severity: calculatedScore.severity,
        answers: calculatedScore.answers
      });

      if (error) throw error;
      
      toast.success('HOOS-12 score opgeslagen!');
      setShowResults(true);
    } catch (error) {
      console.error('Error saving HOOS12:', error);
      toast.error('Er ging iets mis bij het opslaan');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'minimal': return 'text-green-600';
      case 'mild': return 'text-yellow-600';
      case 'moderate': return 'text-orange-600';
      case 'severe': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityText = (severity) => {
    switch (severity) {
      case 'minimal': return 'Minimale beperkingen';
      case 'mild': return 'Lichte beperkingen';
      case 'moderate': return 'Matige beperkingen';
      case 'severe': return 'Ernstige beperkingen';
      default: return 'Onbekend';
    }
  };

  if (showResults && score) {
    return (
      <div className="container max-w-2xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              HOOS-12 Resultaat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-primary mb-2">
                {score.total_score}
              </div>
              <div className="text-sm text-muted-foreground">van 100 punten</div>
              <div className={`text-xl font-semibold mt-2 ${getSeverityColor(score.severity)}`}>
                {getSeverityText(score.severity)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">{score.pain_score}</div>
                <div className="text-xs text-muted-foreground">Pijn</div>
              </div>
              <div className="bg-muted p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">{score.function_daily_score}</div>
                <div className="text-xs text-muted-foreground">Functie dagelijks</div>
              </div>
              <div className="bg-muted p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">{score.function_sports_score}</div>
                <div className="text-xs text-muted-foreground">Functie sport</div>
              </div>
              <div className="bg-muted p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">{score.quality_of_life_score}</div>
                <div className="text-xs text-muted-foreground">Kwaliteit van leven</div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-sm">
              <strong>Interpretatie:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>80-100: Minimale beperkingen</li>
                <li>60-79: Lichte beperkingen</li>
                <li>40-59: Matige beperkingen</li>
                <li>0-39: Ernstige beperkingen</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => navigate('/dashboard')} className="flex-1">
                Naar Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/exercises')} className="flex-1">
                Start Oefeningen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = HOOS12_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / HOOS12_QUESTIONS.length) * 100;
  const currentAnswer = answers[question.id];

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">HOOS-12 Vragenlijst</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          Overslaan
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Vraag {currentQuestion + 1} van {HOOS12_QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <div className="text-xs font-medium text-primary uppercase tracking-wide mb-2">
            {question.category === 'pain' && 'Pijn'}
            {question.category === 'function_daily' && 'Functie Dagelijks Leven'}
            {question.category === 'function_sports' && 'Functie Sport/Recreatie'}
            {question.category === 'quality_of_life' && 'Kwaliteit van Leven'}
          </div>
          <CardTitle className="text-lg">{question.text}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={currentAnswer?.toString()} 
            onValueChange={handleAnswer}
            className="space-y-3"
          >
            {question.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={option.value.toString()} 
                  id={`q-${option.value}`}
                />
                <Label 
                  htmlFor={`q-${option.value}`}
                  className="flex-1 cursor-pointer py-2"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Vorige
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!currentAnswer || loading}
          className="flex-1"
        >
          {currentQuestion === HOOS12_QUESTIONS.length - 1 ? (
            loading ? 'Opslaan...' : 'Afronden'
          ) : (
            <>
              Volgende
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}