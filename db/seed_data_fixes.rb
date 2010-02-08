# # # # #
#   WARNING:
#   Fix scripts must be idempotent, because every script will 
#   be executed everytimes the system its installed or updated
#
#   Author: Martin Abente (tch) - tincho_02@hotmail.com | mabente@paraguayeduca.org
#   For Paraguay Educa OLPC Deployment
#


# WARNING: all methods identifiers must start with "fix_"
class SeedDataFixes

  def fix_old_broken_parts_to_ripped

    ripped_status = Status.find_by_internal_tag("ripped")
    raise "Ripped status type is required" if !ripped_status

    inc = [:parts => :status]
    Part.transaction do

      deviceClasses = [Laptop, Battery, Charger]
      deviceClasses.each { |deviceClass|
  
        deviceClass.find(:all, :include => inc).each { |device|

          mainPart = Part.findPart(device, deviceClass.name.downcase)
          device.getSubPartsOn.each { |part| 

            if part != mainPart && part.status.internal_tag == "broken"

              mainPart.status_id = ripped_status.id
              mainPart.save!
            end
          }
        }
      }
    end

    true
  end

  def fix_students_with_no_barcode

    inc = [:performs => :profile]
    cond = ["profiles.internal_tag = ? and people.barcode is NULL","student"]
    Person.find(:all, :conditions => cond, :include => inc).each { |person|

      person.generateBarCode
      person.save 
    }

    true
  end

  def fix_repeated_problem_reports

    ProblemReport.find(:all, :order => "problem_reports.id DESC").each { |problem_report|

      id = problem_report.id
      created_at = problem_report.created_at
      laptop_serial = problem_report.laptop.serial_number
      problem_type_tag = problem_report.problem_type.internal_tag

      inc = [:laptop, :problem_type]
      cond = [""]

      #It can only delete older ones because, theres no way to know if the newest one
      #are repeated entries or they are real new entries, in case the older one is solved.
      cond[0] += "problem_reports.id < ? and "
      cond[0] += "problem_reports.created_at <= ? and "
      cond[0] += "laptops.serial_number = ? and "
      cond[0] += "problem_types.internal_tag = ? and "
      cond[0] += "problem_reports.solved = ?"

      cond.push(id)
      cond.push(created_at)
      cond.push(laptop_serial)
      cond.push(problem_type_tag)
      cond.push(false)

      repeated_not_solved = ProblemReport.find(:all, :conditions => cond, :include => inc).collect(&:id)
      #puts "For #{id} deleting #{repeated_not_solved.join(',')}!" if repeated_not_solved != []
      ProblemReport.destroy(repeated_not_solved)
    }
    true
  end

end

fixes = SeedDataFixes.new
fixes.methods.each { |method| fixes.send(method) if method.match("^fix_") }

