import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useTheme } from '../themecontext';

type Event = {
  time: string;
  title: string;
};

type Schedule = {
  lunes: Event[];
  martes: Event[];
  miércoles: Event[];
  jueves: Event[];
  viernes: Event[];
};

type Areas = {
  crossTraining: Schedule;
  box: Schedule;
  usosMultiples: Schedule;
  ciclismo: Schedule;
};

const scheduleData: Areas = {
  crossTraining: {
    lunes: [
      { time: "7:00 AM", title: "Blast The Fat" },
      { time: "8:00 AM", title: "PCXT / Suspension / Cross" },
      { time: "6:00 PM", title: "PCXT / Suspension / Cross" },
      { time: "7:00 PM", title: "Blast The Fat" },
    ],
    martes: [
      { time: "7:00 AM", title: "PCXT / Suspension / Cross" },
      { time: "8:00 AM", title: "Blast The Fat" },
      { time: "6:00 PM", title: "Blast The Fat" },
      { time: "7:00 PM", title: "PCXT / Suspension / Cross" },
    ],
    miércoles: [
      { time: "7:00 AM", title: "PCXT Bosu" },
      { time: "8:00 AM", title: "PCXT Bosu" },
      { time: "6:00 PM", title: "PCXT Bosu" },
      { time: "7:00 PM", title: "PCXT Bosu" },
    ],
    jueves: [
      { time: "7:00 AM", title: "PCXT / Suspension / Cross" },
      { time: "8:00 AM", title: "Blast The Fat" },
      { time: "6:00 PM", title: "Blast The Fat" },
      { time: "7:00 PM", title: "PCXT / Suspension / Cross" },
    ],
    viernes: [
      { time: "7:00 AM", title: "Blast The Fat" },
      { time: "8:00 AM", title: "PCXT / Suspension / Cross" },
      { time: "6:30 PM", title: "Blast The Fat PCXT / Suspension / Cross" },
    ],
  },
  box: {
    lunes: [],
    martes: [
      { time: "10:00 AM", title: "Box" },
      { time: "6:00 PM", title: "Box" },
    ],
    miércoles: [],
    jueves: [
      { time: "10:00 AM", title: "Box" },
      { time: "6:00 PM", title: "Box" },
    ],
    viernes: [],
  },
  usosMultiples: {
    lunes: [
      { time: "7:00 AM", title: "Steel T. / Tonic" },
      { time: "8:00 AM", title: "Fit Combat" },
      { time: "9:00 AM", title: "Ritmos Latinos" },
      { time: "10:00 AM", title: "Fit Yoga" },
      { time: "6:30 PM", title: "Dance With Lemus" },
    ],
    martes: [
      { time: "7:00 AM", title: "Steel Jump" },
      { time: "8:00 AM", title: "Dragon Fight" },
      { time: "9:00 AM", title: "Step Dance" },
      { time: "6:00 PM", title: "Steel Training" },
      { time: "7:00 PM", title: "Steel Combat" },
      { time: "8:00 PM", title: "Mat Pilates" },
    ],
    miércoles: [
      { time: "7:00 AM", title: "Steel T. / Tonic" },
      { time: "8:00 AM", title: "Fit Combat" },
      { time: "9:00 AM", title: "Ritmos Latinos" },
      { time: "10:00 AM", title: "Fit Yoga" },
      { time: "6:00 PM", title: "Ritmos Latinos" },
      { time: "7:00 PM", title: "Steel Jump" },
    ],
    jueves: [
      { time: "7:00 AM", title: "Steel Jump" },
      { time: "8:00 AM", title: "Dragon Fight" },
      { time: "9:00 AM", title: "Step Dance" },
      { time: "6:00 PM", title: "Steel Training" },
      { time: "7:00 PM", title: "Steel Combat" },
      { time: "8:00 PM", title: "Mat Pilates" },
    ],
    viernes: [
      { time: "7:00 AM", title: "Steel T. / Tonic" },
      { time: "8:00 AM", title: "Fit Combat" },
      { time: "9:00 AM", title: "Ritmos Latinos" },
      { time: "6:30 PM", title: "Dance with Lemus" },
    ],
  },
  ciclismo: {
    lunes: [
      { time: "9:00 AM", title: "Indoor Cycling (Sesión sin instructor, virtual)" },
      { time: "5:00 PM", title: "Indoor Cycling (Sesión sin instructor, virtual)" },
      { time: "6:00 PM", title: "Intelligent Cycling" },
      { time: "7:00 PM", title: "Indbike" },
    ],
    martes: [
      { time: "6:00 AM", title: "Indoor Cycling" },
      { time: "8:00 AM", title: "Indoor Cycling" },
      { time: "9:00 AM", title: "Indoor Cycling (Sesión sin instructor, virtual)" },
      { time: "5:00 PM", title: "Indoor Cycling (Sesión sin instructor, virtual)" },
      { time: "6:00 PM", title: "Best Cycling" },
      { time: "7:00 PM", title: "Intelligent Cycling" },
    ],
    miércoles: [
      { time: "9:00 AM", title: "Indoor Cycling (Sesión sin instructor, virtual)" },
      { time: "5:00 PM", title: "Indoor Cycling (Sesión sin instructor, virtual)" },
      { time: "6:00 PM", title: "Intelligent Cycling" },
      { time: "7:00 PM", title: "Indbike" },
    ],
    jueves: [
      { time: "6:00 AM", title: "Indoor Cycling" },
      { time: "8:00 AM", title: "Indoor Cycling" },
      { time: "9:00 AM", title: "Indoor Cycling (Sesión sin instructor, virtual)" },
      { time: "5:00 PM", title: "Indoor Cycling (Sesión sin instructor, virtual)" },
      { time: "6:00 PM", title: "Intelligent Cycling" },
      { time: "7:00 PM", title: "Indbike" },
    ],
    viernes: [],
  },
};

export default function Calendar() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'Oscuro';

  const [selectedDay, setSelectedDay] = useState<keyof Schedule>("lunes");
  const [selectedArea, setSelectedArea] = useState<keyof Areas | 'all'>('all');

  const daysOfWeek = ["lunes", "martes", "miércoles", "jueves", "viernes"];
  const daysOfWeekLabels = ["lun", "mar", "mié", "jue", "vie"];
  const today = new Date();
  const currentDayIndex = today.getDay() === 0 || today.getDay() === 6 ? 0 : today.getDay() - 1;

  const eventColors = [
    isDarkMode ? styles.eventColorDark0 : styles.eventColor0,
    isDarkMode ? styles.eventColorDark1 : styles.eventColor1,
    isDarkMode ? styles.eventColorDark2 : styles.eventColor2,
    isDarkMode ? styles.eventColorDark3 : styles.eventColor3,
  ];

  const renderGroupedEvents = () => {
    const areaData = selectedArea === 'all' ? Object.values(scheduleData) : [scheduleData[selectedArea]];
    const allEvents = areaData.flatMap(schedule => schedule[selectedDay]);

    const groupedEvents = allEvents.reduce((acc, event) => {
      if (!acc[event.time]) {
        acc[event.time] = [];
      }
      acc[event.time].push(event.title);
      return acc;
    }, {} as { [key: string]: string[] });

    const sortedTimes = Object.keys(groupedEvents).sort((a, b) => parseTime(a) - parseTime(b));

    return sortedTimes.map((time, index) => (
      <View key={index} style={[styles.event, eventColors[index % eventColors.length]]}>
        <Text style={[styles.eventTime, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>{time}</Text>
        {groupedEvents[time].map((title, idx) => (
          <Text key={idx} style={[styles.eventTitle, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>
            {title}
          </Text>
        ))}
      </View>
    ));
  };

  const parseTime = (time: string) => {
    const [hourString, minuteString] = time.split(":");
    const hour = parseInt(hourString, 10);
    const minute = parseInt(minuteString.slice(0, 2), 10);
    const isPM = time.includes("PM");
    return (isPM && hour !== 12 ? hour + 12 : hour % 12) + minute / 60;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#121212' : '#F0F0F0' }]}>
      <View style={styles.container}>
        <View style={styles.weekDaysContainer}>
          {daysOfWeek.map((day, index) => (
            <TouchableOpacity key={index} onPress={() => setSelectedDay(day as keyof Schedule)}>
              <Text style={[styles.weekDayText, index === currentDayIndex && styles.selectedDayText]}>
                {daysOfWeekLabels[index]}
              </Text>
              <Text style={[styles.weekDayNumber, day === selectedDay && styles.selectedDayNumber]}>
                {today.getDate() + index - currentDayIndex}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
          <Text style={[styles.eventCount, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>
            {Array.isArray(renderGroupedEvents()) ? renderGroupedEvents().length : 0} Eventos
          </Text>
          <Text style={[styles.dayTitle, { color: isDarkMode ? '#FFFFFF' : '#333' }]}>{selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}</Text>

          <View style={styles.filterContainer}>
            <TouchableOpacity onPress={() => setSelectedArea('all')} style={[styles.filterButton, selectedArea === 'all' && styles.selectedFilterButton]}>
              <Text style={[styles.filterText, selectedArea === 'all' && styles.selectedFilterText]}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedArea('crossTraining')} style={[styles.filterButton, selectedArea === 'crossTraining' && styles.selectedFilterButton]}>
              <Text style={[styles.filterText, selectedArea === 'crossTraining' && styles.selectedFilterText]}>Cross Training</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedArea('box')} style={[styles.filterButton, selectedArea === 'box' && styles.selectedFilterButton]}>
              <Text style={[styles.filterText, selectedArea === 'box' && styles.selectedFilterText]}>Box</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedArea('ciclismo')} style={[styles.filterButton, selectedArea === 'ciclismo' && styles.selectedFilterButton]}>
              <Text style={[styles.filterText, selectedArea === 'ciclismo' && styles.selectedFilterText]}>Ciclismo</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {renderGroupedEvents()}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 10, paddingTop: 20 },
  weekDaysContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 },
  weekDayText: { color: '#888', fontSize: 20, textAlign: 'left', marginBottom: -8 },
  selectedDayText: { color: '#fff', fontWeight: 'bold', marginBottom: -8 },
  weekDayNumber: { color: '#888', fontSize: 53, textAlign: 'center', fontWeight: 'bold' },
  selectedDayNumber: { color: '#fff', fontWeight: 'bold', fontSize: 53 },
  filterContainer: { flexDirection: 'row', marginVertical: 10 },
  filterButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#E0E0E0', marginHorizontal: 5 },
  selectedFilterButton: { backgroundColor: '#CCCCCC' },
  filterText: { color: '#666' },
  selectedFilterText: { color: '#333', fontWeight: 'bold' },
  scrollView: { flex: 1 },
  dayTitle: { fontSize: 54, fontWeight: "bold", marginBottom: 1 },
  eventCount: { fontSize: 16, marginBottom: -5 },
  event: { marginVertical: 5, padding: 10, borderRadius: 5 },
  eventTime: { fontSize: 12 },
  eventTitle: { fontSize: 14, fontWeight: "bold" },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 7,
    marginVertical: 10,
  },
  eventColor0: { backgroundColor: "#FFE5B4" },
  eventColor1: { backgroundColor: "#FFB6C1" },
  eventColor2: { backgroundColor: "#D8E3FF" },
  eventColor3: { backgroundColor: "#DFF2BF" },
  eventColorDark0: { backgroundColor: "#3E2723" },
  eventColorDark1: { backgroundColor: "#4E342E" },
  eventColorDark2: { backgroundColor: "#3E4A6B" },
  eventColorDark3: { backgroundColor: "#2E7D32" },
});